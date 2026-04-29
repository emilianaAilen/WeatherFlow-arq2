import { describe, expect, it } from "@jest/globals";
import { User } from "./User";
import { SubscriptionsList } from "../../value-objects/SubscriptionsList";

describe("User", () => {
  describe("getFullName", () => {
    it("returns the concatenation of name and surname", () => {
      const user = User.create("id-1", "Jane", "Doe", "jane@example.com");
      expect(user.getFullName()).toBe("Jane Doe");
    });
  });

  describe("getEmail", () => {
    it("returns the user email", () => {
      const user = User.create("id-1", "Jane", "Doe", "jane@example.com");
      expect(user.getEmail()).toBe("jane@example.com");
    });
  });

  describe("getSubscriptions", () => {
    it("returns an empty subscriptions list by default", () => {
      const user = User.create("id-1", "Jane", "Doe", "jane@example.com");
      expect(user.getSubscriptions().stationIds.length).toBe(0);
    });

    it("returns the provided subscriptions list", () => {
      const subscriptions = SubscriptionsList.create([
        "station-1",
        "station-2",
      ]);
      const user = User.create(
        "id-1",
        "Jane",
        "Doe",
        "jane@example.com",
        subscriptions,
      );
      expect(user.getSubscriptions().stationIds).toEqual([
        "station-1",
        "station-2",
      ]);
    });
  });
});
