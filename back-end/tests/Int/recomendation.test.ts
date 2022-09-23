import app from "../../src/app";
import supertest from "supertest";
import recomendationFactory from "../factory/recomendationFactory"
import { prisma } from "../../src/database";

const server = supertest(app)

beforeEach(async()=>{
  await prisma.$executeRaw`TRUNCATE recommendations RESTART IDENTITY`
})
describe("Test Insert Recomendation POST / ",()=>{
  it('Test Sending Correct Data Format to Post, Expect 201 and Not Falsy',async()=>{
    const recomendation =  recomendationFactory.allowedRecomendation()
    const result = await server.post("/recommendations").send(recomendation)
    const recomendationCreated =await getRecomendationByName(recomendation.name)
    expect(result.status).toBe(201)
    expect(recomendationCreated).not.toBeFalsy()
  });
  it('Test Sending Incorrect Name Data Format to Post, Expect 422 and Falsy',async()=>{
    const recomendation = recomendationFactory.wrongNameRecomendation();
    const {name} = recomendation
    const result = await server.post("/recommendations").send(recomendation)
    expect(result.status).toBe(422);
  });
  it('Test Sending Incorrect Youtube Link Data Format to Post, expect 422 and Falsy',async()=>{
    const recomendation = recomendationFactory.wrongLinkRecomendation();
    const result = await server.post("/recommendations").send(recomendation)
    expect(result.status).toBe(422)
  });
  it('Test Sending Same Recomendation Name to Post, expect 409 and array.length Equal 1',async()=>{
    const recomendation = recomendationFactory.allowedRecomendation()
    await server.post("/recommendations").send(recomendation)
    const result = await server.post("/recommendations").send(recomendation)
    const recomendationsByName = await prisma.recommendation.findMany({where:{name:recomendation.name}})
    expect(result.status).toBe(409)
    expect(recomendationsByName.length).toBe(1)

  });
})

 async function getRecomendationByName(name:string) {
  const recomendation=  await prisma.recommendation.findUnique({where:{name}})
  return recomendation
}