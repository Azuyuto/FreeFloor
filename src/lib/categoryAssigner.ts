import { Player } from "./types";

// src/lib/categoryAssigner.ts
export function assignCategoriesToPlayers(
    players: Record<string, Player>,
    availableCategories: string[]
  ): Record<string, string> {
    const playerIds = Object.keys(players);
    
    if (playerIds.length === 0 || availableCategories.length === 0) {
      return {};
    }
  
    // Skopiuj i przetasuj dostępne kategorie
    const shuffledCategories = [...availableCategories].sort(() => Math.random() - 0.5);
    const assignments: Record<string, string> = {};
  
    // Przypisz kategorie graczom
    playerIds.forEach((playerId, index) => {
      // Jeśli zabraknie unikalnych kategorii, zaczynaj od nowa (duplikaty)
      const categoryIndex = index % shuffledCategories.length;
      assignments[playerId] = shuffledCategories[categoryIndex];
    });
  
    return assignments;
  }
  
  // Fisher-Yates shuffle dla lepszej losowości (opcjonalna funkcja pomocnicza)
  export function fisherYatesShuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  