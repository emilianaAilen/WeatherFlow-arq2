export interface StationReadModel {
  id: string;
  name: string;
}

export interface IStationReadModelRepository {
  save(station: StationReadModel): Promise<void>;
  findById(id: string): Promise<StationReadModel | null>;
  findByName(name: string): Promise<StationReadModel | null>;
  update(id: string, name: string): Promise<void>;
  remove(id: string): Promise<void>;
}
