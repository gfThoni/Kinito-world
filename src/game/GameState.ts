export const gameState = {
  inventory: [] as string[],

  addItem(item: string) {
    this.inventory.push(item);
  },

  hasItem(item: string) {
    return this.inventory.includes(item);
  }
};