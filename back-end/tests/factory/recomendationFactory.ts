import { faker } from "@faker-js/faker";
import { Recommendation } from "@prisma/client";
import { prisma } from "../../src/database";
import { CreateRecommendationData } from "../../src/services/recommendationsService";

function allowedRecomendation(): CreateRecommendationData {
  const youtubeLink = `https://www.youtube.com/${faker.lorem.words(1)}`;
  return {
    name: faker.name.firstName(),
    youtubeLink,
  };
}

function wrongNameRecomendation(): { name: number; youtubeLink: string } {
  const youtubeLink = `https://www.youtube.com/${faker.lorem.words()}`;
  return {
    name: Number(faker.random.numeric()),
    youtubeLink,
  };
}

function wrongLinkRecomendation(): CreateRecommendationData {
  const youtubeLink = faker.internet.url();
  return {
    name: faker.name.firstName(),
    youtubeLink,
  };
}

function randomNumber(setArrange?: { min: number; max: number }): number {
  return faker.datatype.number({ ...setArrange });
}

async function createManyRecomendations(
  amount: number,
  custom?: { isRandomScore?: boolean; returnlimit?: number }
) {
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
        }),
      };
      const recommendationCreated: Recommendation = await recomendation(
        setData
      );
      allRecommendations.push(recommendationCreated);
      limit++;
    }
  }

  if (returnLimit) {
    return returnArrayByNewest(allRecommendations, returnLimit);
  }

  return allRecommendations;
}

async function recomendation(setData?: Partial<Recommendation>) {
  const recomendation: Recommendation = await prisma.recommendation.create({
    data: { ...allowedRecomendation(), ...setData },
  });
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
// function returnArrayByScoreOrder(list: Recommendation[], order: string) {
//   if (order === "desc") {
//     list.sort((prev: Recommendation, curr: Recommendation): any => {
//       if (prev.score > curr.score) {
//         return -1;
//       } else {
//         return true;
//       }
//     });
//     return list;
//   }
//   if (order === "asc") {
//     list.sort((prev: Recommendation, curr: Recommendation): any => {
//       if (prev.score < curr.score) {
//         return -1;
//       } else {
//         return true;
//       }
//     });
//     return list;
//   }
// }
export default {
  allowedRecomendation,
  wrongNameRecomendation,
  wrongLinkRecomendation,
  recomendation,
  randomNumber,
  createManyRecomendations,
};
