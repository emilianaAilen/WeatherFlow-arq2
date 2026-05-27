import amqplib, { Channel, ChannelModel } from "amqplib";
import { IStationReadModelRepository } from "@/infrastructure/ports/IStationReadModelRepository";

const QUEUE = "station-events";

export class RabbitMQStationEventConsumer {
  private model: ChannelModel | null = null;
  private channel: Channel | null = null;

  constructor(
    private readonly url: string,
    private readonly stationReadModelRepository: IStationReadModelRepository,
  ) {}

  async start(): Promise<void> {
    this.model = await amqplib.connect(this.url);
    this.channel = await this.model.createChannel();
    await this.channel.assertQueue(QUEUE, { durable: true });

    this.channel.consume(QUEUE, async (msg) => {
      if (!msg) return;

      try {
        const payload = JSON.parse(msg.content.toString());

        switch (payload.eventType) {
          case "StationCreated":
            await this.stationReadModelRepository.save({
              id: payload.id,
              name: payload.name,
            });
            break;
          case "StationUpdated":
            await this.stationReadModelRepository.update(
              payload.id,
              payload.name,
            );
            break;
          case "StationDeleted":
            await this.stationReadModelRepository.remove(payload.id);
            break;
          default:
            console.warn(`Unknown event type: ${payload.eventType}`);
        }

        this.channel?.ack(msg);
      } catch (error) {
        console.error("Error processing station event", error);
        this.channel?.nack(msg, false, false);
      }
    });
  }

  async stop(): Promise<void> {
    await this.channel?.close();
    await this.model?.close();
  }
}
