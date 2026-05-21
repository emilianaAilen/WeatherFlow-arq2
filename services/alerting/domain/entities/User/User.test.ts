import { describe, expect, it } from "@jest/globals";
import { User } from "./User";
import { SubscriptionsList } from "../../value-objects/SubscriptionsList";
import { SubscriptionError } from "../../errors/SubscriptionError";

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

  describe("subscribe", () => {
    it("returns a new User with the station added to subscriptions", () => {
      const user = User.create("id-1", "Jane", "Doe", "jane@example.com");
      const updated = user.subscribe("station-1");
      expect(updated.getSubscriptions().isSubscribed("station-1")).toBe(true);
    });

    it("does not mutate the original user", () => {
      const user = User.create("id-1", "Jane", "Doe", "jane@example.com");
      user.subscribe("station-1");
      expect(user.getSubscriptions().isSubscribed("station-1")).toBe(false);
    });

    it("throws SubscriptionError when the user is already subscribed", () => {
      const user = User.create(
        "id-1",
        "Jane",
        "Doe",
        "jane@example.com",
        SubscriptionsList.create(["station-1"]),
      );
      expect(() => user.subscribe("station-1")).toThrow(SubscriptionError);
    });
  });
});
