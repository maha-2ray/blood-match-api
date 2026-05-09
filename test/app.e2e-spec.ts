import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "./../src/app.module";

describe("Application (e2e)", () => {
  let app: any;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it("should start the application", () => {
    expect(app).toBeDefined();
  });

  afterAll(async () => {
    await app.close();
  });
});
