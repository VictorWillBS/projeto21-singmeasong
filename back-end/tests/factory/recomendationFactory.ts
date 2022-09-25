import { faker } from '@faker-js/faker';
import { Recommendation } from '@prisma/client';
import { prisma } from '../../src/database';
import { CreateRecommendationData } from '../../src/services/recommendationsService';


function allowedRecomendation(): CreateRecommendationData {
  const youtubeLink = `https://www.youtube.com/${faker.lorem.words()}`;
  return {
    name: faker.name.firstName(),
    youtubeLink
  }
}

function wrongNameRecomendation(): { name: any, youtubeLink: string } {

  const youtubeLink = `https://www.youtube.com/${faker.lorem.words()}`;
  return {
    name: Number(faker.random.numeric()),
    youtubeLink
  }
}

function wrongLinkRecomendation(): CreateRecommendationData {
  const youtubeLink = faker.internet.url();
  return {
    name: faker.name.firstName(),
    youtubeLink
  }
}

function randomNumber() {
  return Number(faker.random.numeric(2))
}

async function createManyRecomendations(amount: number, custom?: { isRandomScore?: boolean, returnlimit?: number }) {
  let limit = 1;
  const allRecommendations: Recommendation[] = [];
  const isRandomScore = custom.isRandomScore || false;
  const returnLimit = custom.returnlimit || false;
  while (limit <= amount) {
    if (!isRandomScore) {
      const recommendationCreated: Recommendation = await recomendation();
      allRecommendations.push(recommendationCreated);
      limit++;
    } else {
      const setData = {
        score: faker.datatype.number({
          max: 20,
          min: -4,
        })
      }
      const recommendationCreated: Recommendation = await recomendation(setData);
      allRecommendations.push(recommendationCreated);
      limit++;
    }
  }

  if (returnLimit) {
    return formatReturnLastCreated(allRecommendations, returnLimit)
  }

  return allRecommendations
}

async function recomendation(setData?: {}) {
  const recomendation: Recommendation = await prisma.recommendation.create({ data: { ...allowedRecomendation(), ...setData } });
  return recomendation
}

function formatReturnLastCreated(list: Recommendation[], limit: number) {
  if (list.length > limit) {
    const newAllRecommendations = list.reverse();
    const sliceLimit = list.length - (list.length - limit)
    return newAllRecommendations.slice(0, sliceLimit)
  } else {
    return list.reverse()
  }
}

export default {
  allowedRecomendation,
  wrongNameRecomendation,
  wrongLinkRecomendation,
  recomendation,
  randomNumber,
  createManyRecomendations
}