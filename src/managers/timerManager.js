// src/managers/timerManager.js

class MinHeap {
  constructor() {
    this.heap = [];
  }

  // 힙에 삽입
  push(item) {
    this.heap.push(item);
    this._heapifyUp();
  }

  // 힙의 최소값(루트) 제거
  pop() {
    if (this.heap.length === 0) return null;
    const root = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this._heapifyDown();
    }
    return root;
  }

  peek() {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  removeById(timerId) {
    const idx = this.heap.findIndex(item => item.id === timerId);
    if (idx === -1) return false;
    const last = this.heap.pop();
    if (idx < this.heap.length) {
      this.heap[idx] = last;
      this._heapifyUp(idx);
      this._heapifyDown(idx);
    }
    return true;
  }

  _heapifyUp(startIdx) {
    let idx = startIdx !== undefined ? startIdx : this.heap.length - 1;
    while (idx > 0) {
      const parentIdx = Math.floor((idx - 1) / 2);
      if (this.heap[idx].expireTime < this.heap[parentIdx].expireTime) {
        [this.heap[idx], this.heap[parentIdx]] = [this.heap[parentIdx], this.heap[idx]];
        idx = parentIdx;
      } else {
        break;
      }
    }
  }

  _heapifyDown(startIdx = 0) {
    let idx = startIdx;
    const length = this.heap.length;
    while (true) {
      const leftIdx = idx * 2 + 1;
      const rightIdx = idx * 2 + 2;
      let smallest = idx;

      if (leftIdx < length && this.heap[leftIdx].expireTime < this.heap[smallest].expireTime) {
        smallest = leftIdx;
      }
      if (rightIdx < length && this.heap[rightIdx].expireTime < this.heap[smallest].expireTime) {
        smallest = rightIdx;
      }
      if (smallest !== idx) {
        [this.heap[idx], this.heap[smallest]] = [this.heap[smallest], this.heap[idx]];
        idx = smallest;
      } else {
        break;
      }
    }
  }
}

class TimerManager {
  constructor() {
    this.heap = new MinHeap();
    this.currentId = 0;

    // 단 하나의 setInterval로 모든 타이머 체크
    this.interval = setInterval(() => {
      const now = Date.now();
      let top = this.heap.peek();

      while (top && top.expireTime <= now) {
        const expired = this.heap.pop();
        if (expired && typeof expired.callback === 'function') {
          expired.callback();
        }
        top = this.heap.peek();
      }
    }, 100); // 100ms마다 체크
  }

  requestTimer(delay, callback) {
    const timerId = ++this.currentId;
    const expireTime = Date.now() + delay;
    this.heap.push({ id: timerId, expireTime, callback });
    return timerId;
  }

  cancelTimer(timerId) {
    return this.heap.removeById(timerId);
  }
}

export default TimerManager;
