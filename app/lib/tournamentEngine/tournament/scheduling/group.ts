export const group = function (numPlayers: number, groupSize: number) {
  const numGroups = Math.ceil(numPlayers / groupSize)
  groupSize = minimalGroupSize(numPlayers, groupSize, numGroups)
  const model = numGroups * groupSize

  const groupList: number[][] = []
  for (let k = 0; k < numGroups; k += 1) {
    groupList[k] = []
  }

  // iterations required to fill groups
  for (let j = 0; j < Math.ceil(groupSize / 2); j += 1) {
    // fill each group with pairs that sum to model + 1
    // until you are in the last iteration (in which may only want one of them)
    for (let g = 0; g < numGroups; g += 1) {
      const a = j * numGroups + g + 1

      groupList[g].push(a)
      if (groupList[g].length < groupSize) {
        groupList[g].push(model + 1 - a)
      }
    }
  }

  // remove non-present players and sort by seeding number
  return groupList.map(function (g) {
    return g
      .sort(function (x, y) {
        return x - y
      })
      .filter(function (p) {
        return p <= numPlayers
      })
  })
}

export const minimalGroupSize = function (
  numPlayers: number,
  groupSize: number,
  numGroups: number = Math.ceil(numPlayers / groupSize)
) {
  while (numGroups * groupSize - numPlayers >= numGroups) {
    groupSize -= 1 // while all groups have 1 free slot
  }
  return groupSize
}
