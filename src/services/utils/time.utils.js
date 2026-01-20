class Timer {
  constructor() {
    this.startTime = null;
    this.endTime = null;
  }

  start() {
    this.startTime = process.hrtime();
  }

  stop() {
    this.endTime = process.hrtime(this.startTime);
  }

  getTime() {
    if (!this.startTime) return 0;
    const diff = process.hrtime(this.startTime);
    return diff[0] * 1000 + diff[1] / 1e6; // milliseconds
  }
}

export default Timer;
