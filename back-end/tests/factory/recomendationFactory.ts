import {faker} from '@faker-js/faker';

 function allowedRecomendation(){
  const youtubeLink = `https://www.youtube.com/${faker.lorem.words()}`
  return{
    name:faker.name.firstName(),
    youtubeLink
  }
}

 function wrongNameRecomendation(){
    
  const youtubeLink = `https://www.youtube.com/${faker.lorem.words()}`
  return{
    name:Number(faker.random.numeric()),
    youtubeLink
  }
}

 function wrongLinkRecomendation(){
  const youtubeLink = faker.internet.url()
  return{
    name:faker.name.firstName(),
    youtubeLink
  }
}

export default {
  allowedRecomendation,
  wrongNameRecomendation,
  wrongLinkRecomendation
}