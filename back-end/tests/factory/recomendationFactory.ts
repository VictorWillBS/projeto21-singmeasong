import {faker} from '@faker-js/faker';
import { Recommendation } from '@prisma/client';
import { prisma } from '../../src/database';
import { CreateRecommendationData } from '../../src/services/recommendationsService';


function allowedRecomendation():CreateRecommendationData{
  const youtubeLink = `https://www.youtube.com/${faker.lorem.words()}`;
  return{
    name:faker.name.firstName(),
    youtubeLink
  }
}

function wrongNameRecomendation():{name:any,youtubeLink:string}{

  const youtubeLink = `https://www.youtube.com/${faker.lorem.words()}`;
  return{
    name:Number(faker.random.numeric()),
    youtubeLink
  }
}

function wrongLinkRecomendation():CreateRecommendationData{
  const youtubeLink = faker.internet.url();
  return{
    name:faker.name.firstName(),
    youtubeLink
  }
}

function randomNumber(){
  return Number(faker.random.numeric(2))
}

async function recomendation(){
 const recomendation : Recommendation= await prisma.recommendation.create({data:{...allowedRecomendation()}});
  return recomendation
}

export default {
  allowedRecomendation,
  wrongNameRecomendation,
  wrongLinkRecomendation,
  recomendation,
  randomNumber
}