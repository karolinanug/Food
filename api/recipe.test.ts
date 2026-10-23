import { describe, expect, it } from "vitest";
import { POST } from "./recipe";

const post = (body: unknown) => POST(new Request("http://x/api/recipe", { method: "POST", body: JSON.stringify(body) }));

describe("/api/recipe", () => {
  it("atmeta neteisingą užklausą", async () => {
    expect((await post({ have: [] })).status).toBe(400);
  });
  it("atmeta nežinomus produktus", async () => {
    const res = await post({ have: ["nera_tokio"], allowExtra: false, meal: "vakariene", servings: 2 });
    expect(res.status).toBe(400);
  });
});
