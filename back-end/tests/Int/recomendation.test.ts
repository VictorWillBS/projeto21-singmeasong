import app from "../../src/app";
import supertest from "supertest";
import recomendationFactory from "../factory/recomendationFactory"
import { prisma } from "../../src/database";
import { Recommendation } from "@prisma/client";
import { faker } from "@faker-js/faker";

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
  });
})

describe("Test Get Last 10 Recommendations GET /recommendations", () => {
  it('Test Get Last 10 Recommendation With Bank Filled, Expect 200 and Array', async () => {
    const allRecomendations = await recomendationFactory.createManyRecomendations(11, { returnlimit: 10 });
    const result = await server.get('/recommendations');
    console.log(result.body)
    expect(result.status).toBe(200);
    expect(result.body).toEqual(allRecomendations);
  });
  it('Test Get Last 10 Recommendation With Empty Bank. Expect 200 and Empty Array', async () => {
    const result = await server.get('/recommendations');
    expect(result.status).toBe(200);
    expect(result.body).toBeInstanceOf(Array);
    expect(result.body.length).toBe(0);
  });
})

describe("Test Get Recommendation by Id GET /recommendations/:id", () => {
  it('Test Get Recommendation Sending Existent Id. Expect 200 and Recommendation Object', async () => {
    const recomendation = await recomendationFactory.recomendation();
    const result = await server.get(`/recommendations/${recomendation.id}`)
    expect(result.status).toBe(200);
    expect(result.body).toStrictEqual(recomendation);
  });
  it('Test Get Recommendation Sending Nonexistent Id.Expect 404', async () => {
    const recomendation = await recomendationFactory.recomendation();
    let fakeId = 0;
    while (fakeId === recomendation.id) {
      fakeId = recomendationFactory.randomNumber();
    }
    const result = await server.get(`/recommendations/${fakeId}`);
    expect(result.status).toBe(404);
    expect(result.body).toEqual({});
  })
})

describe("Test Get Random Recommendation GET /recommendations/random", () => {
  it('Test get Random Recommendation. Expect 200 and Random Recommendation Object', async () => {

    const recomendations = await recomendationFactory.createManyRecomendations(15, { isRandomScore: true });
    console.log(recomendations);
    const result = await server.get('/recommendations/random');
    const recomendationFound = recomendations.filter((recomendation, i) => {
      if (recomendation.id === result.body.id) {
        return recomendation
      } else if (i === recomendations.length - 1) {
        return 0
      }
    });
    expect(result.status).toBe(200);
    expect(result.body).toStrictEqual(recomendationFound[0]);
  })
  it('Test get Random Recommendation. Empty Bank. Expect 404.', async () => {
    const result = await server.get('/recommendations/random');
    expect(result.status).toBe(404);
    expect(result.body).toStrictEqual({});
  })
  it.todo('Test get Random Recommendation. Only Score < 10. Expect 200 and Score < 10 Recommendation Object')
  it.todo('Test get Random Recommendation. Only Score >  10. Expect 200 and Score > 10 Recommendation Object')
});

describe("Test Get Amount of Recommendation Order by Score GET /recommendations/top/:amount", () => {
  it('Test get Random Amount TOP Recommendation. Expect 200 and Random Amount TOP Recommendation Object',async()=>{
    const qntRecomendation = recomendationFactory.randomNumber()
    await recomendationFactory.createManyRecomendations(15,{isRandomScore:true})
  })
  it.todo('Test get 13 TOP Recommendation. Expect 200 and 13 TOP Recommendation Object')
  it.todo('Test get 0 TOP Recommendation. Expect 200 and Empty Object');
  it.todo('Test get BD Registere < Amout TOP Recommendation. Expect 200 and All Recomendations Object')



})