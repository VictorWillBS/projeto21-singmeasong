import { faker } from "@faker-js/faker";
import { Recommendation } from "@prisma/client";
import { CreateRecommendationData } from "../../../src/services/recommendationsService";

function allowedRecomendation(): Recommendation {
  const youtubeLink = `https://www.youtube.com/${faker.lorem.words(1)}`;
  return {
    id: faker.datatype.number(),
    name: faker.name.firstName(),
    youtubeLink,
    score: 0,
  };
}

function randomNumber(setArrange?: { min: number; max: number }): number {
  return faker.datatype.number({ ...setArrange });
}

function createRecomendation(setData?: Partial<Recommendation>) {
  const recomendation: Recommendation = {
    ...allowedRecomendation(),
    ...setData,
  };

  return recomendation;
}
function returnArrayByNewest(list: Recommendation[], limit: number) {
  if (list.length > limit) {
    const newAllRecommendations = list.reverse();
    const sliceLimit = list.length - (list.length - limit);
    return newAllRecommendations.slice(0, sliceLimit);
  } else {
    return list.reverse();
  }
}
function returnArrayByScoreOrder(list: Recommendation[], order: string) {
  if (order === "desc") {
    list.sort((prev: Recommendation, curr: Recommendation): any => {
      if (prev.score > curr.score) {
        return -1;
      } else {
        return true;
      }
    });
    return list;
  }
  if (order === "asc") {
    list.sort((prev: Recommendation, curr: Recommendation): any => {
      if (prev.score < curr.score) {
        return -1;
      } else {
        return true;
      }
    });
    return list;
  }
}
function fakeCreateManyRecomendations(
  limit: number,
  custom?: {
    returnByNewest?: boolean;
    returnByScore?: boolean;
    randomRange?: [number, number];
  }
) {
  let index = 0;
  const recomendationArray = [];
  let randomScore;
  while (index <= limit) {
    if (custom.randomRange) {
      randomScore = randomNumber({
        min: custom.randomRange[0],
        max: custom.randomRange[1],
      });
    } else {
      randomScore = randomNumber();
    }
    const recomendation = createRecomendation({ score: randomScore });
    recomendationArray.push(recomendation);
    index++;
  }
  if (custom.returnByNewest) {
    return returnArrayByNewest(recomendationArray, limit);
  }
  if (custom.returnByScore) {
    return returnArrayByScoreOrder(recomendationArray, "desc");
  }
  return recomendationArray;
}
export default {
  allowedRecomendation,
  createRecomendation,
  randomNumber,
  fakeCreateManyRecomendations,
};
