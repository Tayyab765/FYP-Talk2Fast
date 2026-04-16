import { careerAPI } from "../infrastructure/api/careerAPI";
import { mockCareers } from "../infrastructure/data/mockCareers";
export const careerService = {
  /**
   * Get all careers
   */
  async getAll() {
    try {
      const response = await careerAPI.getAll();
      return response.data;
    } catch (error) {
      console.error("Failed to fetch careers:", error);
      return mockCareers;
    }
  },
  /**
   * Get career by ID
   */
  async getById(id) {
    try {
      const response = await careerAPI.getById(id);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch career:", error);
      return mockCareers.find(c => c.id === id) || null;
    }
  },
  /**
   * Search careers
   */
  async search(query) {
    try {
      const response = await careerAPI.search(query || '');
      return response.data.careers || [];
    } catch (error) {
      console.error("Failed to search careers:", error);
      return [];
    }
  },
  
  /**
   * Get salary statistics
   */
  async getStats() {
    try {
      const response = await careerAPI.getStats();
      return response.data.stats || null;
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      return null;
    }
  },
  /**
   * Get high-growth careers
   */
  async getHighGrowthCareers() {
    try {
      const all = await this.getAll();
      return all.filter(c => c.growth > 15).sort((a, b) => b.growth - a.growth);
    } catch (error) {
      console.error("Failed to fetch high-growth careers:", error);
      return [];
    }
  },
  /**
   * Get careers by industry
   */
  async getByIndustry(industry) {
    try {
      const all = await this.getAll();
      return all.filter(c => c.industry === industry);
    } catch (error) {
      console.error("Failed to fetch careers by industry:", error);
      return [];
    }
  }
};