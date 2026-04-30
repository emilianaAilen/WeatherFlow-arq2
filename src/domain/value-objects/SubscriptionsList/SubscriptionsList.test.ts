import { describe, expect, it } from "@jest/globals";
import { SubscriptionsList } from "./SubscriptionsList";
import { SubscriptionError } from "../../errors/SubscriptionError";

describe("SubscriptionsList", () => {
  describe("add", () => {
    it("returns a new list with the station ID added", () => {
      const list = SubscriptionsList.create();
      const updated = list.add("station-1");
      expect(updated.isSubscribed("station-1")).toBe(true);
    });

    it("does not mutate the original list", () => {
      const list = SubscriptionsList.create();
      list.add("station-1");
      expect(list.isSubscribed("station-1")).toBe(false);
    });

    it("throws SubscriptionError when adding a duplicate station ID", () => {
      const list = SubscriptionsList.create(["station-1"]);
      expect(() => list.add("station-1")).toThrow(SubscriptionError);
    });
  });

  describe("remove", () => {
    it("removes an existing station ID from the list", () => {
      const list = SubscriptionsList.create(["station-1", "station-2"]);
      list.remove("station-1");
      expect(list.isSubscribed("station-1")).toBe(false);
      expect(list.isSubscribed("station-2")).toBe(true);
    });

    it("does nothing when removing a station ID that is not in the list", () => {
      const list = SubscriptionsList.create(["station-1"]);
      list.remove("station-99");
      expect(list.stationIds.length).toBe(1);
    });
  });

  describe("isSubscribed", () => {
    it("returns true for a subscribed station ID", () => {
      const list = SubscriptionsList.create(["station-1"]);
      expect(list.isSubscribed("station-1")).toBe(true);
    });

    it("returns false for a station ID that is not subscribed", () => {
      const list = SubscriptionsList.create();
      expect(list.isSubscribed("station-1")).toBe(false);
    });
  });

  describe("create", () => {
    it("creates an empty list by default", () => {
      const list = SubscriptionsList.create();
      expect(list.stationIds.length).toBe(0);
    });

    it("creates a list pre-populated with the given station IDs", () => {
      const list = SubscriptionsList.create(["station-1", "station-2"]);
      expect(list.stationIds).toEqual(["station-1", "station-2"]);
    });
  });
});
