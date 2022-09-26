import { recommendationService } from "../../src/services/recommendationsService";
import { recommendationRepository } from "../../src/repositories/recommendationRepository.js";
import recommendationFactory from "../factory/unit/recomendationFactoryUnit";

beforeEach(() => {
  jest.resetAllMocks();
});

describe("Test Insert Function", () => {
  it("Insert New Recommendation, Correct Data Format.", async () => {
    jest
      .spyOn(recommendationRepository, "findByName")
      .mockImplementationOnce((): any => {
        return;
      });

    jest
      .spyOn(recommendationRepository, "create")
      .mockImplementationOnce((): any => {
        return;
      });

    const createData = recommendationFactory.allowedRecomendation();

    await recommendationService.insert(createData);

    expect(recommendationRepository.findByName).toBeCalled();
    expect(recommendationRepository.create).toBeCalled();
  });

  it("Insert Recommendation Already existent.", async () => {
    jest
      .spyOn(recommendationRepository, "findByName")
      .mockImplementationOnce((): any => {
        return true;
      });

    jest
      .spyOn(recommendationRepository, "create")
      .mockImplementationOnce((): any => {
        return;
      });

    const createData = recommendationFactory.allowedRecomendation();

    const result = recommendationService.insert(createData);
    expect(result).rejects.toStrictEqual({
      type: "conflict",
      message: "Recommendations names must be unique",
    });
    expect(recommendationRepository.findByName).toBeCalled();
  });
});

describe("Test Upvote Function", () => {
  it("Try Upvote Correct Id, expect function toBeCalled", async () => {
    const recommendation = {
      ...recommendationFactory.allowedRecomendation(),
      id: 1,
      score: 10,
    };

    jest
      .spyOn(recommendationRepository, "find")
      .mockResolvedValueOnce(recommendation);

    jest
      .spyOn(recommendationRepository, "updateScore")
      .mockResolvedValueOnce(null);

    await recommendationService.upvote(recommendation.id);

    expect(recommendationRepository.find).toBeCalled();
    expect(recommendationRepository.updateScore).toBeCalled();
  });
  it("Try Upvote a Nonexistent Id", () => {
    jest
      .spyOn(recommendationRepository, "find")
      .mockResolvedValueOnce(undefined);

    const result = recommendationService.upvote(1);

    expect(result).rejects.toStrictEqual({
      type: "not_found",
      message: "",
    });
    expect(recommendationRepository.find).toBeCalled();
  });
});

describe("test Downvote Function", () => {
  it("Test Downvote Correct Id, expect function toBeCalled", async () => {
    const recommendation = {
      ...recommendationFactory.allowedRecomendation(),
      id: 1,
      score: 15,
    };
    jest
      .spyOn(recommendationRepository, "find")
      .mockResolvedValueOnce(recommendation);
    jest
      .spyOn(recommendationRepository, "updateScore")
      .mockResolvedValueOnce({ ...recommendation, score: 14 });

    await recommendationService.downvote(1);

    expect(recommendationRepository.find).toBeCalled();
    expect(recommendationRepository.updateScore).toBeCalled();
  });

  it("Test Downvote Recommendation score < -5, expect to try exclude Recommendation", async () => {
    const recommendation = {
      ...recommendationFactory.allowedRecomendation(),
      id: 1,
      score: -5,
    };
    jest
      .spyOn(recommendationRepository, "find")
      .mockResolvedValueOnce(recommendation);
    jest
      .spyOn(recommendationRepository, "updateScore")
      .mockResolvedValueOnce({ ...recommendation, score: -6 });
    jest
      .spyOn(recommendationRepository, "remove")
      .mockImplementationOnce((): any => {
        return;
      });

    await recommendationService.downvote(recommendation.id);

    expect(recommendationRepository.find).toBeCalled();
    expect(recommendationRepository.updateScore).toBeCalled();
    expect(recommendationRepository.remove).toBeCalled();
  });
});

describe("Test Get By Id Or Fail Function", () => {
  it("Should Return Recommendation by Id", async () => {
    const recommendation = {
      ...recommendationFactory.allowedRecomendation(),
      id: 1,
      score: 15,
    };
    jest
      .spyOn(recommendationRepository, "find")
      .mockResolvedValueOnce(recommendation);
    const result = await recommendationService.getById(recommendation.id);
    expect(result).toStrictEqual(recommendation);
    expect(recommendationRepository.find).toBeCalled();
  });
  it("Should Fail trying Get a Nonexistent Recommendation", async () => {
    jest
      .spyOn(recommendationRepository, "find")
      .mockResolvedValueOnce(undefined);

    const result = recommendationService.getById(1);
    expect(result).rejects.toStrictEqual({
      type: "not_found",
      message: "",
    });
    expect(recommendationRepository.find).toBeCalled();
  });
});

describe("Test Get Function", () => {
  it("Most Return All Lasted 10 recommendations", async () => {
    const recommendations = recommendationFactory.fakeCreateManyRecomendations(
      11,
      { returnByNewest: true }
    );

    jest
      .spyOn(recommendationRepository, "findAll")
      .mockResolvedValueOnce(recommendations);

    const result = await recommendationService.get();

    expect(result).toStrictEqual(recommendations);
    expect(recommendationRepository.findAll).toBeCalled();
  });
  it("Most Return a Empty Array", async () => {
    jest
      .spyOn(recommendationRepository, "findAll")
      .mockResolvedValueOnce(undefined);
    const result = await recommendationService.get();
    expect(result).toBeUndefined();
    expect(recommendationRepository.findAll).toBeCalled();
  });
});

describe("Test Get Top Function", () => {
  it("Most Return Random Number Top Recommendations ", async () => {
    const recomendations = recommendationFactory.fakeCreateManyRecomendations(
      10,
      { returnByScore: true }
    );
    const topAmount = recommendationFactory.randomNumber({ min: 1, max: 10 });
    const sliceLimit =
      recomendations.length - (recomendations.length - topAmount);
    const expectRecommendations = recomendations.slice(0, sliceLimit);
    jest
      .spyOn(recommendationRepository, "getAmountByScore")
      .mockResolvedValueOnce(expectRecommendations);

    const result = await recommendationService.getTop(topAmount);

    expect(result).toStrictEqual(expectRecommendations);
    expect(recommendationRepository.getAmountByScore).toBeCalled();
  });
});

describe("Test Get Random Function", () => {
  it("Most Return Recommendation with Score > 10", async () => {
    const randomNum = recommendationFactory.randomNumber({ min: 0, max: 10 });
    const recommendation = recommendationFactory.fakeCreateManyRecomendations(
      10,
      { randomRange: [11, 100] }
    );
    jest.spyOn(Math, "random").mockReturnValueOnce(0.6);
    jest
      .spyOn(recommendationRepository, "findAll")
      .mockResolvedValueOnce(recommendation);
    jest.spyOn(Math, "random").mockReturnValueOnce(randomNum / 10);

    const result = await recommendationService.getRandom();

    expect(result.score).toBeGreaterThan(10);
    expect(Math.random).toBeCalledTimes(2);
    expect(recommendationRepository.findAll).toBeCalled();
  });
  it("Most Return Recommendation With Score < 10", async () => {
    const randomNum = recommendationFactory.randomNumber({ min: 0, max: 10 });
    const recommendation = recommendationFactory.fakeCreateManyRecomendations(
      10,
      { randomRange: [-4, 10] }
    );

    jest.spyOn(Math, "random").mockReturnValueOnce(0.8);
    jest
      .spyOn(recommendationRepository, "findAll")
      .mockResolvedValueOnce(recommendation);
    jest.spyOn(Math, "random").mockReturnValueOnce(randomNum / 10);

    const result = await recommendationService.getRandom();

    expect(result.score).toBeLessThanOrEqual(10);
    expect(Math.random).toBeCalledTimes(2);
    expect(recommendationRepository.findAll).toBeCalled();
  });
  it("Most Throw Error Not Found", async () => {
    const randomNum = recommendationFactory.randomNumber({ min: 0, max: 10 });
    jest.spyOn(Math, "random").mockReturnValueOnce(randomNum / 10);
    jest.spyOn(recommendationRepository, "findAll").mockResolvedValueOnce([]);
    jest.spyOn(recommendationRepository, "findAll").mockResolvedValueOnce([]);
    jest.spyOn(Math, "random").mockReturnValueOnce(randomNum / 10);

    const result = recommendationService.getRandom();

    expect(result).rejects.toStrictEqual({
      type: "not_found",
      message: "",
    });
    expect(Math.random).toBeCalled();
    expect(recommendationRepository.findAll).toBeCalled();
  });
});
