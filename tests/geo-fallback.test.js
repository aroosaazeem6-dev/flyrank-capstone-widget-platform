const geoService = require("../src/services/geoService");

describe("Geo provider fallback", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("falls back safely when both geo providers fail", async () => {
    jest
      .spyOn(global, "fetch")
      .mockRejectedValueOnce(
        new Error("Provider A unavailable")
      )
      .mockRejectedValueOnce(
        new Error("Provider B unavailable")
      );

    const result = await geoService.getGeoLocation("8.8.8.8");

    expect(result).toBeNull();

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  test("skips geo lookup for local/private IP addresses", async () => {
    const fetchMock = jest.spyOn(global, "fetch");

    const result = await geoService.getGeoLocation("127.0.0.1");

    expect(result).toBeNull();

    expect(fetchMock).not.toHaveBeenCalled();
  });
});