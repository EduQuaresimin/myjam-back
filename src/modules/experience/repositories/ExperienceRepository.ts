import{AppDataSource}from "../../../data-source";
import{Experience}from "../../../entities/Experience";

export const ExperienceRepository=AppDataSource.getRepository(Experience);