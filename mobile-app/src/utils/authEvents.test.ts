import { notifyAuthChanged, onAuthChanged } from "./authEvents";

describe("authEvents", () => {
  it("calls registered listeners", () => {
    const listener = jest.fn();
    const unsubscribe = onAuthChanged(listener);

    notifyAuthChanged();

    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("does not call listener after unsubscribe", () => {
    const listener = jest.fn();
    const unsubscribe = onAuthChanged(listener);

    unsubscribe();
    notifyAuthChanged();

    expect(listener).not.toHaveBeenCalled();
  });
});
