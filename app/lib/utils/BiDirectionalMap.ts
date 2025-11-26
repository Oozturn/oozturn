export class BiDirectionalMap<L, R> {
  private leftToRight = new Map<L, R>()
  private rightToLeft = new Map<R, L>()

  constructor(entries?: readonly (readonly [L, R])[] | null) {
    if (entries) {
      entries.forEach((entry) => this.set(entry[0], entry[1]))
    }
  }

  entries() {
    return this.leftToRight.entries()
  }

  set(left: L, right: R) {
    this.leftToRight.set(left, right)
    this.rightToLeft.set(right, left)
  }

  getLeft(right: R) {
    return this.rightToLeft.get(right)
  }

  getRight(left: L) {
    return this.leftToRight.get(left)
  }

  public get size(): number {
    return this.leftToRight.size
  }
}
