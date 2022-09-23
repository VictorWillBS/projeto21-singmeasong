import app from "../../src/app";
import supertest from "supertest";
import recomendationFactory from "../factory/recomendationFactory"
import { prisma } from "../../src/database";
import { Recommendation } from "@prisma/client";

const server = supertest(app)

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE recommendations RESTART IDENTITY`
});
afterAll(() => {
  prisma.$disconnect
});

async function getRecomendationByName(name: string) {
  const recomendation: Recommendation = await prisma.recommendation.findUnique({ where: { name } });
  return recomendation
}

describe("Test Insert Recomendation POST /recommendations", () => {
  it('Test Sending Correct Data Format to Post, Expect 201 and Not Falsy', async () => {
    const recomendation = recomendationFactory.allowedRecomendation()
    const result = await server.post("/recommendations").send(recomendation)
    const recomendationCreated = await getRecomendationByName(recomendation.name)
    expect(result.status).toBe(201)
    expect(recomendationCreated).not.toBeFalsy()
  });

  it('Test Sending Incorrect Name Data Format to Post, Expect 422 and Falsy', async () => {
    const recomendation = recomendationFactory.wrongNameRecomendation();
    const { name } = recomendation
    const result = await server.post("/recommendations").send(recomendation)
    expect(result.status).toBe(422);
  });

  it('Test Sending Incorrect Youtube Link Data Format to Post, expect 422 and Falsy', async () => {
    const recomendation = recomendationFactory.wrongLinkRecomendation();
    const result = await server.post("/recommendations").send(recomendation)
    expect(result.status).toBe(422)
  });

  it('Test Sending Same Recomendation Name to Post, expect 409 and array.length Equal 1', async () => {
    const recomendation = recomendationFactory.allowedRecomendation()
    await server.post("/recommendations").send(recomendation)
    const result = await server.post("/recommendations").send(recomendation)
    const recomendationsByName = await prisma.recommendation.findMany({ where: { name: recomendation.name } })
    expect(result.status).toBe(409)
    expect(recomendationsByName.length).toBe(1)

  });
});

describe("Test UpVote Recommendation POST /recommendations/:id/upvote", () => {
  it('Test UpVote in Correct Recommendation Id, Expect 200 ', async () => {
    const { id, score, name } = await recomendationFactory.recomendation();
    const result = await server.post(`/recommendations/${id}/upvote`).send();
    const updatedRecommendation = await getRecomendationByName(name);
    const scoreWasIncreased = updatedRecommendation.score > score;

    expect(result.status).toBe(200);
    expect(scoreWasIncreased).toBeTruthy();
  });
  it('Test UpVote Sending nonexistent Recommendation Id, Expect 404', async () => {
    const { id, score, name } = await recomendationFactory.recomendation();
    let fakeId = 0;
    while (fakeId === id) {
      fakeId = recomendationFactory.randomNumber();
    }
    const result = await server.post(`/recommendations/${fakeId}/upvote`);
    const updatedRecommendation = await getRecomendationByName(name);
    const isScoreEqual = updatedRecommendation.score === score;

    expect(result.status).toBe(404);
    expect(isScoreEqual).toBeTruthy();
  });
});

describe("Test DownVote Recommendation POST /recommendations/:id/downvote", () => {
  it('Test Downvote Sending Correct Recommendation Id, Expect 200', async () => {
    const { id, score, name } = await recomendationFactory.recomendation();
    const result = await server.post(`/recommendations/${id}/downvote`);
    const updatedRecommendation = await getRecomendationByName(name);
    const scoreWasDegrade = updatedRecommendation.score < score;

    expect(result.status).toBe(200);
    expect(scoreWasDegrade).toBeTruthy();
  });
  it('Test Downvote Sending Recommendation Id & Score >5, Expect 200 & Recommendation Deleted', async () => {
    const { id, name } = await recomendationFactory.recomendation({ score: -5 });
    const result = await server.post(`/recommendations/${id}/downvote`);
    const updatedRecommendation = await getRecomendationByName(name);

    expect(result.status).toBe(200);
    expect(updatedRecommendation).toBeFalsy();
  });
  it('Test Downvote Sending Nonexistent Recommendation Id, Expect 404', async () => {
    const { id, score, name } = await recomendationFactory.recomendation();
    let fakeId = 0;
    while (fakeId === id) {
      fakeId = recomendationFactory.randomNumber();
    }
    const result = await server.post(`/recommendations/${fakeId}/downvote`);
    const updatedRecommendation = await getRecomendationByName(name);
    const isScoreEqual = updatedRecommendation.score === score;

    expect(result.status).toBe(404);
    expect(isScoreEqual).toBeTruthy();
  })
})

describe("Test Get Last 10 Recommendations GET /recommendations", () => {
  it('Test Get Last 10 Recommendation, Bank Filled, Expect 200 and Array', async () => {
    await recomendationFactory.createManyRecomendations(13);
    const result = await server.get('/recommendations');
    console.log(result.body.length)
    expect(result.status).toBe(200);
    expect(result.body).toBeInstanceOf(Array);
    expect(result.body.length).toBeLessThanOrEqual(10);
  });
  it('Test Get Last 10 Recommendation, But with Empty DataBank. Expect 200 and Empty Array',async()=>{
    const result = await server.get('/recommendations');
    expect(result.status).toBe(200);
    expect(result.body).toBeInstanceOf(Array);
    expect(result.body.length).toBe(0);
  })
})