export let group = function (numPlayers: number, groupSize: number) {
  var numGroups = Math.ceil(numPlayers / groupSize);
  groupSize = minimalGroupSize(numPlayers, groupSize, numGroups);
  var model = numGroups * groupSize;

  var groupList: number[][] = [];
  for (var k = 0; k < numGroups; k += 1) {
    groupList[k] = [];
  }

  // iterations required to fill groups
  for (var j = 0; j < Math.ceil(groupSize / 2); j += 1) {
    // fill each group with pairs that sum to model + 1
    // until you are in the last iteration (in which may only want one of them)
    for (var g = 0; g < numGroups; g += 1) {
      var a = j * numGroups + g + 1;

      groupList[g].push(a);
      if (groupList[g].length < groupSize) {
        groupList[g].push(model + 1 - a);
      }
    }
  }

  // remove non-present players and sort by seeding number
  return groupList.map(function (g) {
    return g.sort(function (x, y) {
      return x - y;
    }).filter(function (p) {
      return p <= numPlayers;
    });
  });
};

let fromArray = function (ary: any[], groupSize: number) {
  return group(ary.length, groupSize).map(function (group) {
    return group.map(function (seed) {
      return ary[seed - 1];
    });
  });
};


export let minimalGroupSize = function (numPlayers: number, groupSize: number, numGroups: number = Math.ceil(numPlayers / groupSize)) {
  while (numGroups * groupSize - numPlayers >= numGroups) {
    groupSize -= 1; // while all groups have 1 free slot
  }
  return groupSize;
};
