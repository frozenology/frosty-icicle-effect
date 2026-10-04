// ========== Seeded Random ==========
    class SeededRandom {
      constructor(seed) {
        this.seed = seed || Date.now();
      }
      next() {
        this.seed = (this.seed * 16807 + 0) % 2147483647;
        return (this.seed - 1) / 2147483646;
      }
      range(min, max) {
        return min + this.next() * (max - min);
      }
      int(min, max) {
        return Math.floor(this.range(min, max + 1));
      }
    }

    // See full source in repo artifacts - loading complete file next commit
    console.warn('Partial generator-part1 - full upload in progress');
