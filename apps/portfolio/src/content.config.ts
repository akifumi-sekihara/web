import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";

import { locales } from "./lib/locales";

const profiles = defineCollection({
  loader: glob({ base: "./src/content/profiles", pattern: "*.json" }),
  schema: z.object({
    avatarAlt: z.string().min(1),
    background: z.string().min(1),
    description: z.string().min(1),
    education: z.string().min(1),
    employment: z.string().min(1),
    home: z.string().min(1),
    interests: z.string().min(1),
    interestsText: z.string().min(1),
    intro: z.string().min(1),
    locale: z.enum(locales),
    location: z.string().min(1),
    lookingAhead: z.string().min(1),
    navigation: z.string().min(1),
    projects: z.string().min(1),
    readPaper: z.string().min(1),
    role: z.string().min(1),
    science: z.string().min(1),
    scienceTitle: z.string().min(1),
    software: z.string().min(1),
    softwareTitle: z.string().min(1),
    timeline: z.string().min(1),
    tools: z.string().min(1),
    translationId: z.literal("portfolio"),
  }),
});
const projects = defineCollection({
  loader: glob({ base: "./src/content/projects", pattern: "*.json" }),
  schema: z.object({
    category: z.string().min(1),
    locale: z.enum(locales),
    paperUrl: z.url(),
    paragraphs: z.array(z.string()).min(1),
    tags: z.array(z.string()),
    title: z.string().min(1),
    translationId: z.string().min(1),
  }),
});
export const collections = { profiles, projects };
