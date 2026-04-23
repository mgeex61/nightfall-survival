const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const dayText = document.getElementById("dayText");
const timeText = document.getElementById("timeText");
const zoneText = document.getElementById("zoneText");
const statusText = document.getElementById("statusText");

const startOverlay = document.getElementById("startOverlay");
const endOverlay = document.getElementById("endOverlay");
const endTitle = document.getElementById("endTitle");
const endText = document.getElementById("endText");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");

const keys = { w: false, a: false, s: false, d: false };

const SCREEN_W = canvas.width;
const SCREEN_H = canvas.height;
const OUTSIDE_WORLD_W = 2600;
const OUTSIDE_WORLD_H = 1600;

let gameStarted = false;
let gameEnded = false;
let animationId = null;
let frameTick = 0;
let isNight = false;
let day = 1;
let timeOfDay = 8 * 60;
let zombieSpawnTimer = 0;
let bullets = [];
let particles = [];
let zombies = [];
let indoorZombies = [];
let lootDrops = [];
let camera = { x: 0, y: 0 };
let mouseScreen = { x: SCREEN_W / 2, y: SCREEN_H / 2 };
let muzzleFlashTimer = 0;
let inventoryOpen = false;

const player = {
  x: 380,
  y: 400,
  width: 30,
  height: 42,
  speed: 3,
  hp: 100,
  hunger: 100,
  food: 1,
  wood: 3,
  medkits: 0,
  hitTimer: 0,
  fireCooldown: 0,
  meleeCooldown: 0,
  meleeTimer: 0,
  facing: 1,
  weapon: "pistol"
};

const world = {
  mode: "outside",
  currentHouseId: null,
  currentFloor: 1
};

const outsideHouses = [
  {
    id: 1,
    x: 220,
    y: 160,
    width: 220,
    height: 170,
    door: { x: 312, y: 274, width: 36, height: 56 },
    outsideSpawn: { x: 320, y: 342 }
  },
  {
    id: 2,
    x: 760,
    y: 220,
    width: 240,
    height: 180,
    door: { x: 860, y: 344, width: 38, height: 56 },
    outsideSpawn: { x: 872, y: 414 }
  },
  {
    id: 3,
    x: 1390,
    y: 350,
    width: 260,
    height: 190,
    door: { x: 1500, y: 484, width: 40, height: 56 },
    outsideSpawn: { x: 1510, y: 552 }
  },
  {
    id: 4,
    x: 1950,
    y: 760,
    width: 240,
    height: 180,
    door: { x: 2052, y: 884, width: 36, height: 56 },
    outsideSpawn: { x: 2062, y: 952 }
  },
  {
    id: 5,
    x: 540,
    y: 980,
    width: 250,
    height: 185,
    door: { x: 645, y: 1109, width: 38, height: 56 },
    outsideSpawn: { x: 657, y: 1177 }
  }
];

function makeFloor1(seedOffset = 0) {
  return {
    width: 1280,
    height: 720,
    spawn: { x: 620, y: 590 },
    exitDoor: {
      x: 602,
      y: 660,
      width: 76,
      height: 26,
      barricade: 0,
      maxBarricade: 5,
      type: "door",
      shake: 0,
      breachCooldown: 0
    },
    windows: [
      { x: 150 + seedOffset, y: 120, width: 110, height: 22, barricade: 0, maxBarricade: 4, type: "window", shake: 0, breachCooldown: 0 },
      { x: 1020 - seedOffset, y: 120, width: 110, height: 22, barricade: 0, maxBarricade: 4, type: "window", shake: 0, breachCooldown: 0 },
      { x: 575, y: 120, width: 120, height: 22, barricade: 0, maxBarricade: 4, type: "window", shake: 0, breachCooldown: 0 }
    ],
    walls: [
      { x: 0, y: 0, width: 1280, height: 36 },
      { x: 0, y: 0, width: 36, height: 720 },
      { x: 1244, y: 0, width: 36, height: 720 },
      { x: 0, y: 684, width: 602, height: 36 },
      { x: 678, y: 684, width: 602, height: 36 },
      { x: 290, y: 240, width: 700, height: 24 },
      { x: 290, y: 240, width: 24, height: 280 },
      { x: 966, y: 240, width: 24, height: 280 },
      { x: 540, y: 420, width: 24, height: 180 }
    ],
    loot: [
      { x: 150, y: 560, looted: false, type: "food" },
      { x: 1100, y: 560, looted: false, type: "wood" },
      { x: 640, y: 170, looted: false, type: "food" },
      { x: 860, y: 520, looted: false, type: "wood" }
    ],
    stairsUp: { x: 1060, y: 560, width: 90, height: 90 },
    stairsDown: null
  };
}

function makeFloor2(seedOffset = 0) {
  return {
    width: 1280,
    height: 720,
    spawn: { x: 1065, y: 565 },
    exitDoor: null,
    windows: [
      { x: 210 + seedOffset, y: 100, width: 100, height: 22, barricade: 0, maxBarricade: 3, type: "window", shake: 0, breachCooldown: 0 },
      { x: 940 - seedOffset, y: 100, width: 100, height: 22, barricade: 0, maxBarricade: 3, type: "window", shake: 0, breachCooldown: 0 }
    ],
    walls: [
      { x: 0, y: 0, width: 1280, height: 36 },
      { x: 0, y: 0, width: 36, height: 720 },
      { x: 1244, y: 0, width: 36, height: 720 },
      { x: 0, y: 684, width: 1280, height: 36 },
      { x: 320, y: 260, width: 640, height: 24 },
      { x: 320, y: 260, width: 24, height: 220 },
      { x: 936, y: 260, width: 24, height: 220 }
    ],
    loot: [
      { x: 170, y: 560, looted: false, type: "food" },
      { x: 1080, y: 530, looted: false, type: "wood" },
      { x: 630, y: 180, looted: false, type: "shotgun" },
      { x: 830, y: 520, looted: false, type: "medkit" }
    ],
    stairsUp: null,
    stairsDown: { x: 1060, y: 560, width: 90, height: 90 }
  };
}

function makeInterior(seedOffset = 0) {
  return {
    floors: {
      1: makeFloor1(seedOffset),
      2: makeFloor2(seedOffset)
    }
  };
}

const interiors = {
  1: makeInterior(0),
  2: makeInterior(20),
  3: makeInterior(40),
  4: makeInterior(60),
  5: makeInterior(10)
};

function cancelLoop() {
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

function resetGame() {
  cancelLoop();

  player.x = 380;
  player.y = 400;
  player.hp = 100;
  player.hunger = 100;
  player.food = 1;
  player.wood = 3;
  player.medkits = 0;
  player.hitTimer = 0;
  player.fireCooldown = 0;
  player.meleeCooldown = 0;
  player.meleeTimer = 0;
  player.facing = 1;
  player.weapon = "pistol";

  keys.w = false;
  keys.a = false;
  keys.s = false;
  keys.d = false;

  world.mode = "outside";
  world.currentHouseId = null;
  world.currentFloor = 1;

  bullets = [];
  particles = [];
  zombies = [];
  indoorZombies = [];
  lootDrops = [];
  day = 1;
  timeOfDay = 8 * 60;
  isNight = false;
  zombieSpawnTimer = 0;
  frameTick = 0;
  muzzleFlashTimer = 0;
  inventoryOpen = false;
  camera.x = 0;
  camera.y = 0;

  for (const id of Object.keys(interiors)) {
    const interior = interiors[id];
    for (const floorKey of Object.keys(interior.floors)) {
      const floor = interior.floors[floorKey];
      if (floor.exitDoor) {
        floor.exitDoor.barricade = 0;
        floor.exitDoor.shake = 0;
        floor.exitDoor.breachCooldown = 0;
      }

      for (const w of floor.windows) {
        w.barricade = 0;
        w.shake = 0;
        w.breachCooldown = 0;
      }

      for (const l of floor.loot) {
        l.looted = false;
      }
    }
  }

  spawnInitialOutsideLoot();
  statusText.textContent = "Ready";
  updateHudTexts();
  gameEnded = false;
}

function spawnInitialOutsideLoot() {
  lootDrops = [
    { x: 520, y: 420, type: "food", taken: false },
    { x: 910, y: 520, type: "wood", taken: false },
    { x: 1210, y: 860, type: "food", taken: false },
    { x: 1710, y: 630, type: "wood", taken: false },
    { x: 2210, y: 990, type: "food", taken: false },
    { x: 780, y: 1280, type: "wood", taken: false },
    { x: 340, y: 1180, type: "food", taken: false },
    { x: 2100, y: 340, type: "wood", taken: false }
  ];
}

function formatTime(minutes) {
  const h = Math.floor(minutes / 60) % 24;
  const m = Math.floor(minutes % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function updateHudTexts() {
  dayText.textContent = String(day);
  timeText.textContent = formatTime(timeOfDay);
  zoneText.textContent =
    world.mode === "outside"
      ? "Outside"
      : `House Floor ${world.currentFloor}`;
}

function addParticles(x, y, color, count = 8, spread = 3) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * spread,
      vy: (Math.random() - 0.5) * spread,
      life: 20 + Math.random() * 18,
      size: 2 + Math.random() * 3,
      color
    });
  }
}

function rectsCollide(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getPlayerRect(nextX = player.x, nextY = player.y) {
  return { x: nextX, y: nextY, width: player.width, height: player.height };
}

function getCurrentInterior() {
  if (world.currentHouseId === null) return null;
  return interiors[world.currentHouseId];
}

function getCurrentFloorData() {
  const interior = getCurrentInterior();
  if (!interior) return null;
  return interior.floors[world.currentFloor];
}

function getWorldMouse() {
  if (world.mode === "outside") {
    return { x: mouseScreen.x + camera.x, y: mouseScreen.y + camera.y };
  }
  return { x: mouseScreen.x, y: mouseScreen.y };
}

function updateCamera() {
  if (world.mode !== "outside") {
    camera.x = 0;
    camera.y = 0;
    return;
  }

  camera.x = clamp(player.x - SCREEN_W / 2, 0, OUTSIDE_WORLD_W - SCREEN_W);
  camera.y = clamp(player.y - SCREEN_H / 2, 0, OUTSIDE_WORLD_H - SCREEN_H);
}

function enterHouse(houseId) {
  world.mode = "inside";
  world.currentHouseId = houseId;
  world.currentFloor = 1;
  const floor = getCurrentFloorData();
  player.x = floor.spawn.x;
  player.y = floor.spawn.y;
  bullets = [];
  indoorZombies = [];
  statusText.textContent = "Inside house";
  updateHudTexts();
}

function switchFloor(targetFloor) {
  const interior = getCurrentInterior();
  if (!interior || !interior.floors[targetFloor]) return;

  world.currentFloor = targetFloor;
  const floor = getCurrentFloorData();

  if (targetFloor === 2 && floor.stairsDown) {
    player.x = floor.stairsDown.x + 18;
    player.y = floor.stairsDown.y + 14;
  } else if (targetFloor === 1 && floor.stairsUp) {
    player.x = floor.stairsUp.x + 18;
    player.y = floor.stairsUp.y + 14;
  }

  indoorZombies = [];
  statusText.textContent = `Floor ${targetFloor}`;
  updateHudTexts();
}

function canExitHouse(floor) {
  return floor.exitDoor && floor.exitDoor.barricade === 0;
}

function exitHouse() {
  const house = outsideHouses.find(h => h.id === world.currentHouseId);
  if (!house) return;

  world.mode = "outside";
  world.currentHouseId = null;
  world.currentFloor = 1;
  player.x = house.outsideSpawn.x;
  player.y = house.outsideSpawn.y;
  bullets = [];
  indoorZombies = [];
  statusText.textContent = "Outside";
  updateHudTexts();
}

function useFood() {
  if (player.food > 0 && player.hunger < 95) {
    player.food -= 1;
    player.hunger += 25;
    if (player.hunger > 100) player.hunger = 100;
    statusText.textContent = "Used food";
    addParticles(player.x + player.width / 2, player.y + 14, "#7dff8a", 14, 4);
    return true;
  }
  return false;
}

function useMedkit() {
  if (player.medkits > 0 && player.hp < 95) {
    player.medkits -= 1;
    player.hp += 30;
    if (player.hp > 100) player.hp = 100;
    statusText.textContent = "Used medkit";
    addParticles(player.x + player.width / 2, player.y + 14, "#8af0ff", 14, 4);
    return true;
  }
  return false;
}

function autoCollectLoot() {
  if (world.mode === "inside") {
    const floor = getCurrentFloorData();
    if (!floor) return;

    for (const item of floor.loot) {
      const lootRect = { x: item.x - 16, y: item.y - 16, width: 32, height: 32 };
      if (!item.looted && rectsCollide(getPlayerRect(), lootRect)) {
        item.looted = true;

        if (item.type === "food") player.food += 1 + Math.floor(Math.random() * 2);
        if (item.type === "wood") player.wood += 2 + Math.floor(Math.random() * 2);
        if (item.type === "shotgun") player.weapon = "shotgun";
        if (item.type === "medkit") player.medkits += 1;

        const label =
          item.type === "food" ? "Food" :
          item.type === "wood" ? "Wood" :
          item.type === "shotgun" ? "Shotgun" :
          "Medkit";

        statusText.textContent = `${label} found`;
        addParticles(item.x, item.y, "#ffd54a", 16, 5);
      }
    }
  } else {
    for (const item of lootDrops) {
      if (item.taken) continue;
      const rect = { x: item.x - 16, y: item.y - 16, width: 32, height: 32 };
      if (rectsCollide(getPlayerRect(), rect)) {
        item.taken = true;
        if (item.type === "food") player.food += 1;
        if (item.type === "wood") player.wood += 2;
        statusText.textContent = item.type === "food" ? "Food found" : "Wood found";
        addParticles(item.x, item.y, item.type === "food" ? "#ffd54a" : "#66b3ff", 14, 5);
      }
    }
  }
}

function tryBarricade() {
  const floor = getCurrentFloorData();
  if (!floor || player.wood <= 0) return false;

  const targets = [
    ...(floor.exitDoor ? [floor.exitDoor] : []),
    ...floor.windows
  ];

  for (const target of targets) {
    const zone = {
      x: target.x - 22,
      y: target.y - 22,
      width: target.width + 44,
      height: target.height + 44
    };

    if (rectsCollide(getPlayerRect(), zone) && target.barricade < target.maxBarricade) {
      target.barricade += 1;
      player.wood -= 1;
      statusText.textContent = `${target.type === "door" ? "Door" : "Window"} barricaded`;
      addParticles(target.x + target.width / 2, target.y + target.height / 2, "#66b3ff", 14, 5);
      return true;
    }
  }

  return false;
}

function tryRemoveBarricade() {
  const floor = getCurrentFloorData();
  if (!floor) return false;

  const targets = [
    ...(floor.exitDoor ? [floor.exitDoor] : []),
    ...floor.windows
  ];

  for (const target of targets) {
    const zone = {
      x: target.x - 22,
      y: target.y - 22,
      width: target.width + 44,
      height: target.height + 44
    };

    if (rectsCollide(getPlayerRect(), zone) && target.barricade > 0) {
      target.barricade -= 1;
      statusText.textContent = "Barricade removed";
      addParticles(target.x + target.width / 2, target.y + target.height / 2, "#ffb366", 12, 5);
      return true;
    }
  }

  return false;
}

function tryActionE() {
  if (useFood()) return;
  if (useMedkit()) return;

  if (world.mode === "inside") {
    if (tryBarricade()) return;
  } else {
    statusText.textContent = "E is for food or medkits";
  }
}

function tryEnterExitF() {
  if (world.mode === "outside") {
    for (const house of outsideHouses) {
      const zone = {
        x: house.door.x - 24,
        y: house.door.y - 24,
        width: house.door.width + 48,
        height: house.door.height + 48
      };
      if (rectsCollide(getPlayerRect(), zone)) {
        enterHouse(house.id);
        return;
      }
    }
    return;
  }

  const floor = getCurrentFloorData();
  if (!floor) return;

  if (floor.stairsUp) {
    const upZone = {
      x: floor.stairsUp.x - 10,
      y: floor.stairsUp.y - 10,
      width: floor.stairsUp.width + 20,
      height: floor.stairsUp.height + 20
    };
    if (rectsCollide(getPlayerRect(), upZone)) {
      switchFloor(2);
      return;
    }
  }

  if (floor.stairsDown) {
    const downZone = {
      x: floor.stairsDown.x - 10,
      y: floor.stairsDown.y - 10,
      width: floor.stairsDown.width + 20,
      height: floor.stairsDown.height + 20
    };
    if (rectsCollide(getPlayerRect(), downZone)) {
      switchFloor(1);
      return;
    }
  }

  if (floor.exitDoor) {
    const exitZone = {
      x: floor.exitDoor.x - 20,
      y: floor.exitDoor.y - 20,
      width: floor.exitDoor.width + 40,
      height: floor.exitDoor.height + 40
    };

    if (rectsCollide(getPlayerRect(), exitZone)) {
      if (canExitHouse(floor)) {
        exitHouse();
      } else {
        statusText.textContent = "Door is barricaded";
      }
    }
  }
}

function spawnZombie() {
  if (world.mode !== "outside") return;

  const side = Math.floor(Math.random() * 4);
  let x = 0;
  let y = 0;

  if (side === 0) {
    x = Math.random() * OUTSIDE_WORLD_W;
    y = -40;
  } else if (side === 1) {
    x = OUTSIDE_WORLD_W + 40;
    y = Math.random() * OUTSIDE_WORLD_H;
  } else if (side === 2) {
    x = Math.random() * OUTSIDE_WORLD_W;
    y = OUTSIDE_WORLD_H + 40;
  } else {
    x = -40;
    y = Math.random() * OUTSIDE_WORLD_H;
  }

  zombies.push({
    x,
    y,
    width: 28,
    height: 42,
    speed: isNight ? 1.2 + Math.random() * 0.55 : 0.78 + Math.random() * 0.35,
    hp: isNight ? 3 : 2,
    attackTimer: 0,
    animOffset: Math.random() * Math.PI * 2
  });
}

function spawnIndoorZombieAt(target) {
  if (indoorZombies.length >= 8) return;

  let spawnX = target.x + target.width / 2 - 14;
  let spawnY = target.y + 24;

  if (target.type === "window") {
    spawnY = target.y + 28;
  } else {
    spawnY = target.y - 36;
  }

  indoorZombies.push({
    x: spawnX,
    y: spawnY,
    width: 28,
    height: 42,
    speed: 1.05 + Math.random() * 0.3,
    hp: 2,
    attackTimer: 0,
    animOffset: Math.random() * Math.PI * 2
  });

  statusText.textContent = "Zombie got inside!";
  addParticles(spawnX + 14, spawnY + 16, "#ff884d", 16, 5);
}

function updateDayCycle() {
  timeOfDay += 0.03;

  if (timeOfDay >= 24 * 60) {
    timeOfDay = 0;
    day += 1;
  }

  isNight = timeOfDay >= 20 * 60 || timeOfDay < 6 * 60;

  updateHudTexts();
}

function getAimAngle() {
  const worldMouse = getWorldMouse();
  return Math.atan2(
    worldMouse.y - (player.y + player.height / 2),
    worldMouse.x - (player.x + player.width / 2)
  );
}

function shootBullet() {
  if (!gameStarted || gameEnded || inventoryOpen) return;
  if (player.fireCooldown > 0) return;

  const angle = getAimAngle();

  if (player.weapon === "pistol") {
    const speed = 9.5;
    bullets.push({
      x: player.x + player.width / 2,
      y: player.y + 22,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 70,
      damage: 1
    });
    player.fireCooldown = 10;
  } else {
    for (let i = 0; i < 5; i++) {
      const spread = (Math.random() - 0.5) * 0.28;
      const a = angle + spread;
      const speed = 9 + Math.random() * 1.5;

      bullets.push({
        x: player.x + player.width / 2,
        y: player.y + 22,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life: 36,
        damage: 1
      });
    }
    player.fireCooldown = 26;
  }

  muzzleFlashTimer = 4;
  addParticles(player.x + player.width / 2, player.y + 22, "#ffe082", 12, 4);
  statusText.textContent = player.weapon === "pistol" ? "Pistol" : "Shotgun";
}

function doMelee() {
  if (!gameStarted || gameEnded || inventoryOpen) return;
  if (player.meleeCooldown > 0) return;

  player.meleeCooldown = 24;
  player.meleeTimer = 8;
  statusText.textContent = "Melee attack";

  const angle = getAimAngle();
  const range = 64;
  const targets = world.mode === "outside" ? zombies : indoorZombies;

  for (const zombie of targets) {
    const zx = zombie.x + zombie.width / 2;
    const zy = zombie.y + zombie.height / 2;
    const dx = zx - (player.x + player.width / 2);
    const dy = zy - (player.y + player.height / 2);
    const dist = Math.hypot(dx, dy);

    if (dist <= range) {
      const zombieAngle = Math.atan2(dy, dx);
      const angleDiff = Math.atan2(Math.sin(zombieAngle - angle), Math.cos(zombieAngle - angle));

      if (Math.abs(angleDiff) < 0.8) {
        zombie.hp -= 2;
        addParticles(zx, zy, "#ff6b6b", 14, 5);
      }
    }
  }
}

function insideWallCollision(nextRect) {
  const floor = getCurrentFloorData();
  if (!floor) return false;

  for (const wall of floor.walls) {
    if (rectsCollide(nextRect, wall)) return true;
  }
  return false;
}

function updatePlayer() {
  let moveX = 0;
  let moveY = 0;

  if (!inventoryOpen) {
    if (keys.w) moveY -= player.speed;
    if (keys.s) moveY += player.speed;
    if (keys.a) moveX -= player.speed;
    if (keys.d) moveX += player.speed;
  }

  if (moveX < 0) player.facing = -1;
  if (moveX > 0) player.facing = 1;

  const tryXRect = getPlayerRect(player.x + moveX, player.y);
  const tryYRect = getPlayerRect(player.x, player.y + moveY);

  if (world.mode === "outside") {
    let blockedX = false;
    let blockedY = false;

    for (const house of outsideHouses) {
      const houseRect = { x: house.x, y: house.y, width: house.width, height: house.height };
      if (rectsCollide(tryXRect, houseRect)) blockedX = true;
      if (rectsCollide(tryYRect, houseRect)) blockedY = true;
    }

    if (!blockedX) player.x += moveX;
    if (!blockedY) player.y += moveY;

    player.x = clamp(player.x, 0, OUTSIDE_WORLD_W - player.width);
    player.y = clamp(player.y, 0, OUTSIDE_WORLD_H - player.height);
  } else {
    if (!insideWallCollision(tryXRect)) player.x += moveX;
    if (!insideWallCollision(tryYRect)) player.y += moveY;

    player.x = clamp(player.x, 0, SCREEN_W - player.width);
    player.y = clamp(player.y, 0, SCREEN_H - player.height);
  }

  if (frameTick % 180 === 0) {
    player.hunger -= isNight ? 2 : 1;
    if (player.hunger < 0) player.hunger = 0;
  }

  if (player.hunger <= 0 && frameTick % 45 === 0) {
    player.hp -= 2;
    statusText.textContent = "You are starving";
  }

  if (player.hitTimer > 0) player.hitTimer--;
  if (player.fireCooldown > 0) player.fireCooldown--;
  if (player.meleeCooldown > 0) player.meleeCooldown--;
  if (player.meleeTimer > 0) player.meleeTimer--;
  if (muzzleFlashTimer > 0) muzzleFlashTimer--;
}

function updateOutsideZombies() {
  if (world.mode !== "outside") return;

  if (zombieSpawnTimer > 0) zombieSpawnTimer--;
  const spawnDelay = isNight ? 20 : 85;

  if (zombieSpawnTimer <= 0) {
    spawnZombie();
    zombieSpawnTimer = spawnDelay;
  }

  for (const zombie of zombies) {
    const dx = player.x - zombie.x;
    const dy = player.y - zombie.y;
    const dist = Math.hypot(dx, dy) || 1;

    zombie.x += (dx / dist) * zombie.speed;
    zombie.y += (dy / dist) * zombie.speed;

    if (zombie.attackTimer > 0) zombie.attackTimer--;

    if (rectsCollide(getPlayerRect(), zombie) && player.hitTimer <= 0) {
      player.hp -= isNight ? 13 : 8;
      player.hitTimer = 36;
      zombie.attackTimer = 16;
      statusText.textContent = "Zombie hit";
      addParticles(player.x + 14, player.y + 14, "#ff4d4d", 14, 5);
    }
  }
}

function updateInsidePressure() {
  if (world.mode !== "inside" || !isNight) return;

  const floor = getCurrentFloorData();
  if (!floor) return;

  const targets = [
    ...(floor.exitDoor ? [floor.exitDoor] : []),
    ...floor.windows
  ];

  for (const target of targets) {
    const interval = target.type === "door" ? 80 : 105;

    if (frameTick % interval === 0) {
      const chance = target.type === "door" ? 0.58 : 0.45;

      if (Math.random() < chance) {
        if (target.barricade > 0) {
          target.barricade -= 1;
          target.shake = 10;
          statusText.textContent = `${target.type === "door" ? "Door" : "Window"} is under attack`;
          addParticles(target.x + target.width / 2, target.y + target.height / 2, "#ff884d", 10, 4);
        } else {
          target.shake = 14;

          if (target.breachCooldown <= 0 && Math.random() < 0.55) {
            spawnIndoorZombieAt(target);
            target.breachCooldown = 140;
          } else if (player.hitTimer <= 0 && Math.random() < 0.16) {
            player.hp -= target.type === "door" ? 9 : 7;
            player.hitTimer = 36;
            statusText.textContent = `${target.type === "door" ? "Door" : "Window"} is open`;
            addParticles(player.x + 14, player.y + 14, "#ff4d4d", 10, 4);
          }
        }
      }
    }

    if (target.shake > 0) target.shake -= 1;
    if (target.breachCooldown > 0) target.breachCooldown -= 1;
  }
}

function updateIndoorZombies() {
  if (world.mode !== "inside") return;

  for (const zombie of indoorZombies) {
    const dx = player.x - zombie.x;
    const dy = player.y - zombie.y;
    const dist = Math.hypot(dx, dy) || 1;

    zombie.x += (dx / dist) * zombie.speed;
    zombie.y += (dy / dist) * zombie.speed;

    if (zombie.attackTimer > 0) zombie.attackTimer--;

    if (rectsCollide(getPlayerRect(), zombie) && player.hitTimer <= 0) {
      player.hp -= 8;
      player.hitTimer = 34;
      zombie.attackTimer = 16;
      statusText.textContent = "Indoor zombie hit";
      addParticles(player.x + 14, player.y + 14, "#ff4d4d", 12, 4);
    }
  }
}

function updateBullets() {
  for (const bullet of bullets) {
    bullet.x += bullet.vx;
    bullet.y += bullet.vy;
    bullet.life -= 1;

    const targets = world.mode === "outside" ? zombies : indoorZombies;

    for (const zombie of targets) {
      if (rectsCollide({ x: bullet.x - 3, y: bullet.y - 3, width: 6, height: 6 }, zombie)) {
        zombie.hp -= bullet.damage;
        bullet.life = 0;
        addParticles(zombie.x + zombie.width / 2, zombie.y + zombie.height / 2, "#ffd54a", 9, 3.5);
        statusText.textContent = "Hit";
      }
    }
  }

  zombies = zombies.filter(z => z.hp > 0);
  indoorZombies = indoorZombies.filter(z => z.hp > 0);

  bullets = bullets.filter(bullet => {
    if (world.mode === "outside") {
      return bullet.life > 0 &&
        bullet.x > -40 && bullet.x < OUTSIDE_WORLD_W + 40 &&
        bullet.y > -40 && bullet.y < OUTSIDE_WORLD_H + 40;
    }
    return bullet.life > 0 &&
      bullet.x > -20 && bullet.x < SCREEN_W + 20 &&
      bullet.y > -20 && bullet.y < SCREEN_H + 20;
  });
}

function updateParticles() {
  particles = particles.filter(p => p.life > 0);
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 1;
  }
}

function checkGameOver() {
  if (player.hp <= 0) {
    gameEnded = true;
    cancelLoop();
    endTitle.textContent = "Game Over";
    endText.textContent = `You survived until day ${day}.`;
    endOverlay.classList.remove("hidden");
  }
}

function drawGrassWorld() {
  const grd = ctx.createLinearGradient(0, 0, 0, OUTSIDE_WORLD_H);
  grd.addColorStop(0, isNight ? "#2f4330" : "#547f57");
  grd.addColorStop(1, isNight ? "#1d2a1e" : "#355338");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, OUTSIDE_WORLD_W, OUTSIDE_WORLD_H);

  for (let i = 0; i < OUTSIDE_WORLD_W; i += 80) {
    for (let j = 0; j < OUTSIDE_WORLD_H; j += 80) {
      ctx.fillStyle = ((i + j) / 80) % 2 === 0
        ? (isNight ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.03)")
        : (isNight ? "rgba(0,0,0,0.03)" : "rgba(0,0,0,0.03)");
      ctx.fillRect(i, j, 80, 80);
    }
  }

  ctx.fillStyle = isNight ? "#3c4348" : "#5c666d";
  ctx.fillRect(0, 720, OUTSIDE_WORLD_W, 90);
  ctx.fillRect(1120, 0, 90, OUTSIDE_WORLD_H);
  ctx.fillRect(450, 1220, 1200, 90);

  if (isNight) {
    ctx.fillStyle = "rgba(8, 10, 20, 0.28)";
    ctx.fillRect(0, 0, OUTSIDE_WORLD_W, OUTSIDE_WORLD_H);
  }
}

function drawTrees() {
  const trees = [
    [120, 120], [620, 120], [1240, 160], [1810, 180], [2350, 260],
    [240, 620], [1880, 520], [2180, 620], [1020, 1120], [1720, 1340],
    [220, 1360], [510, 1460], [2360, 1200]
  ];

  for (const [x, y] of trees) {
    ctx.fillStyle = "#6e4828";
    ctx.fillRect(x + 10, y + 20, 14, 26);

    ctx.fillStyle = isNight ? "#355838" : "#4f8a52";
    ctx.beginPath();
    ctx.arc(x + 17, y + 14, 22, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHouseOutside(house) {
  ctx.fillStyle = "#6a4b32";
  ctx.fillRect(house.x, house.y, house.width, house.height);

  ctx.fillStyle = "#7b5639";
  ctx.fillRect(house.x + 10, house.y + 12, house.width - 20, house.height - 24);

  ctx.fillStyle = "#8b2e24";
  ctx.beginPath();
  ctx.moveTo(house.x - 10, house.y);
  ctx.lineTo(house.x + house.width / 2, house.y - 34);
  ctx.lineTo(house.x + house.width + 10, house.y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#c7d7e6";
  ctx.fillRect(house.x + 24, house.y + 30, 34, 30);
  ctx.fillRect(house.x + house.width - 58, house.y + 30, 34, 30);

  ctx.fillStyle = "#50301f";
  ctx.fillRect(house.door.x, house.door.y, house.door.width, house.door.height);

  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.fillRect(house.x + 14, house.y + house.height - 10, house.width - 28, 6);
}

function drawOutsideLoot() {
  for (const item of lootDrops) {
    if (item.taken) continue;

    ctx.save();
    if (item.type === "food") {
      ctx.shadowColor = "#ffd54a";
      ctx.shadowBlur = 10;
      ctx.fillStyle = "#ffd54a";
      ctx.beginPath();
      ctx.arc(item.x, item.y, 7, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = "#9a6a3c";
      ctx.fillRect(item.x - 8, item.y - 6, 16, 12);
      ctx.fillStyle = "#b9844d";
      ctx.fillRect(item.x - 6, item.y - 4, 12, 3);
    }
    ctx.restore();
  }
}

function drawInsideBackground() {
  ctx.fillStyle = "#5f513e";
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

  ctx.fillStyle = "#8d7b63";
  ctx.fillRect(36, 36, SCREEN_W - 72, SCREEN_H - 72);

  ctx.fillStyle = "#7c6a54";
  ctx.fillRect(90, 80, 220, 110);
  ctx.fillRect(930, 88, 180, 90);
  ctx.fillRect(500, 360, 250, 120);
  ctx.fillRect(170, 500, 120, 70);

  ctx.fillStyle = "#6d5d48";
  ctx.fillRect(96, 86, 208, 10);
  ctx.fillRect(936, 94, 168, 10);
  ctx.fillRect(506, 366, 238, 10);

  if (isNight) {
    ctx.fillStyle = "rgba(12, 16, 28, 0.16)";
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
  }
}

function drawInsideWalls() {
  const floor = getCurrentFloorData();
  if (!floor) return;
  ctx.fillStyle = "#5a4634";
  for (const wall of floor.walls) {
    ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
  }
}

function drawStairs() {
  const floor = getCurrentFloorData();
  if (!floor) return;

  ctx.font = "700 42px Arial";

  if (floor.stairsUp) {
    ctx.fillStyle = "#6f7f90";
    ctx.fillRect(floor.stairsUp.x, floor.stairsUp.y, floor.stairsUp.width, floor.stairsUp.height);
    ctx.fillStyle = "#dfe8f2";
    ctx.fillText("↑", floor.stairsUp.x + 30, floor.stairsUp.y + 58);
  }

  if (floor.stairsDown) {
    ctx.fillStyle = "#6f7f90";
    ctx.fillRect(floor.stairsDown.x, floor.stairsDown.y, floor.stairsDown.width, floor.stairsDown.height);
    ctx.fillStyle = "#dfe8f2";
    ctx.fillText("↓", floor.stairsDown.x + 30, floor.stairsDown.y + 58);
  }
}

function drawInsideLoot() {
  const floor = getCurrentFloorData();
  if (!floor) return;

  for (const item of floor.loot) {
    if (item.looted) continue;

    ctx.save();
    ctx.shadowColor = "#ffd54a";
    ctx.shadowBlur = 12;

    if (item.type === "shotgun") {
      ctx.fillStyle = "#444";
      ctx.fillRect(item.x - 14, item.y - 4, 28, 8);
      ctx.fillStyle = "#7b5639";
      ctx.fillRect(item.x + 6, item.y - 3, 10, 6);
    } else if (item.type === "medkit") {
      ctx.fillStyle = "#d94b4b";
      ctx.fillRect(item.x - 10, item.y - 10, 20, 20);
      ctx.fillStyle = "#fff";
      ctx.fillRect(item.x - 2, item.y - 7, 4, 14);
      ctx.fillRect(item.x - 7, item.y - 2, 14, 4);
    } else {
      ctx.fillStyle = "#ffd54a";
      ctx.beginPath();
      ctx.arc(item.x, item.y, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

function drawInsideBarricades() {
  const floor = getCurrentFloorData();
  if (!floor) return;

  const targets = [
    ...(floor.exitDoor ? [floor.exitDoor] : []),
    ...floor.windows
  ];

  for (const target of targets) {
    const shakeOffsetX = target.shake ? Math.sin(frameTick * 0.9) * 2 : 0;
    const shakeOffsetY = target.shake ? Math.cos(frameTick * 0.9) * 1.5 : 0;

    if (target.type === "door") {
      ctx.fillStyle = "#50301f";
      ctx.fillRect(target.x + shakeOffsetX, target.y + shakeOffsetY, target.width, target.height);
      ctx.fillStyle = "#6e4528";
      ctx.fillRect(target.x + 5 + shakeOffsetX, target.y + 5 + shakeOffsetY, target.width - 10, target.height - 10);
    } else {
      ctx.fillStyle = "#b9d7ef";
      ctx.fillRect(target.x + shakeOffsetX, target.y + shakeOffsetY, target.width, target.height);
      ctx.strokeStyle = "#8fb7d7";
      ctx.lineWidth = 2;
      ctx.strokeRect(target.x + shakeOffsetX, target.y + shakeOffsetY, target.width, target.height);

      ctx.strokeStyle = "#94bfe4";
      ctx.beginPath();
      ctx.moveTo(target.x + target.width / 2 + shakeOffsetX, target.y + shakeOffsetY);
      ctx.lineTo(target.x + target.width / 2 + shakeOffsetX, target.y + target.height + shakeOffsetY);
      ctx.moveTo(target.x + shakeOffsetX, target.y + target.height / 2 + shakeOffsetY);
      ctx.lineTo(target.x + target.width + shakeOffsetX, target.y + target.height / 2 + shakeOffsetY);
      ctx.stroke();
    }

    for (let i = 0; i < target.barricade; i++) {
      ctx.fillStyle = "#9a6a3c";
      if (target.type === "door") {
        ctx.fillRect(target.x - 7 + shakeOffsetX, target.y + 5 + i * 10 + shakeOffsetY, target.width + 14, 7);
      } else {
        ctx.fillRect(target.x + 4 + shakeOffsetX, target.y - 2 + i * 7 + shakeOffsetY, target.width - 8, 6);
      }
    }

    if (target.type === "window" && isNight) {
      const visibleZombie = target.barricade <= 1;
      if (visibleZombie && Math.sin(frameTick * 0.08 + target.x) > 0.3) {
        const zx = target.x + target.width / 2 - 12 + shakeOffsetX;
        const zy = target.y + 3 + shakeOffsetY;

        ctx.fillStyle = "rgba(118, 181, 90, 0.85)";
        ctx.beginPath();
        ctx.arc(zx + 12, zy + 9, 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(77, 127, 56, 0.85)";
        ctx.fillRect(zx + 5, zy + 16, 14, 10);
      }
    }
  }
}

function drawHumanLikeCharacter(x, y, options = {}) {
  const moving = options.moving || false;
  const hurt = options.hurt || false;
  const zombie = options.zombie || false;
  const bob = moving ? Math.abs(Math.sin(frameTick * 0.22 + (options.animOffset || 0))) * 1.6 : 0;
  const walk = moving ? Math.sin(frameTick * 0.22 + (options.animOffset || 0)) * 2 : 0;

  ctx.save();

  if (hurt) ctx.globalAlpha = 0.55;

  ctx.fillStyle = zombie ? "#2d4030" : "#2d5bff";
  ctx.fillRect(x + 7, y + 28 + walk * 0.8, 7, 14 - walk * 0.1);
  ctx.fillRect(x + 17, y + 28 - walk * 0.8, 7, 14 + walk * 0.1);

  ctx.fillStyle = zombie ? "#1d2a21" : "#2b2b2f";
  ctx.fillRect(x + 6, y + 39 + walk * 0.8, 8, 3);
  ctx.fillRect(x + 16, y + 39 - walk * 0.8, 8, 3);

  ctx.fillStyle = zombie ? "#4d7f38" : "#d94b4b";
  ctx.fillRect(x + 6, y + 16 + bob, 18, 13);

  ctx.fillStyle = zombie ? "#7faa67" : "#f0c6a4";
  if (zombie) {
    ctx.fillRect(x + 1, y + 18 + walk * 0.2, 8, 4);
    ctx.fillRect(x + 22, y + 18 - walk * 0.2, 8, 4);
  } else {
    ctx.fillRect(x + 2, y + 18 + walk * 0.7, 4, 11);
    ctx.fillRect(x + 24, y + 18 - walk * 0.7, 4, 11);
  }

  ctx.beginPath();
  ctx.fillStyle = zombie ? "#76b55a" : "#f0c6a4";
  ctx.arc(x + 15, y + 9 + bob, 8.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = zombie ? "#567a44" : "#4a2b1b";
  ctx.fillRect(x + 9, y + 0 + bob, 12, 5);

  ctx.fillStyle = zombie ? "#f4f1d0" : "#1f1f22";
  ctx.fillRect(x + 12, y + 8 + bob, 2, 2);
  ctx.fillRect(x + 17, y + 8 + bob, 2, 2);

  if (zombie) {
    ctx.fillStyle = "#8b1e1e";
    ctx.fillRect(x + 12, y + 8 + bob, 1, 1);
    ctx.fillRect(x + 17, y + 8 + bob, 1, 1);
    ctx.fillStyle = "#2a1212";
    ctx.fillRect(x + 11, y + 14 + bob, 7, 2);
  }

  ctx.restore();
}

function drawPlayer() {
  const moving = !inventoryOpen && (keys.w || keys.a || keys.s || keys.d);

  ctx.save();

  if (isNight) {
    ctx.shadowColor = "rgba(150, 220, 255, 0.16)";
    ctx.shadowBlur = 8;
  }

  drawHumanLikeCharacter(player.x, player.y, {
    moving,
    hurt: player.hitTimer > 0 && Math.floor(player.hitTimer / 4) % 2 === 0,
    zombie: false
  });

  const angle = getAimAngle();
  const gunX = player.x + 15;
  const gunY = player.y + 23;

  ctx.strokeStyle = player.weapon === "shotgun" ? "#544" : "#2f2f34";
  ctx.lineWidth = player.weapon === "shotgun" ? 5 : 4;
  ctx.beginPath();
  ctx.moveTo(gunX, gunY);
  ctx.lineTo(gunX + Math.cos(angle) * 16, gunY + Math.sin(angle) * 16);
  ctx.stroke();

  if (muzzleFlashTimer > 0) {
    ctx.fillStyle = "rgba(255,220,120,0.9)";
    ctx.beginPath();
    ctx.arc(
      gunX + Math.cos(angle) * 18,
      gunY + Math.sin(angle) * 18,
      5 + muzzleFlashTimer,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  if (player.meleeTimer > 0) {
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(gunX, gunY, 38, angle - 0.7, angle + 0.7);
    ctx.stroke();
  }

  ctx.restore();
}

function drawZombieCollection(collection) {
  for (const zombie of collection) {
    drawHumanLikeCharacter(zombie.x, zombie.y, {
      moving: true,
      zombie: true,
      animOffset: zombie.animOffset
    });
  }
}

function drawBullets() {
  for (const bullet of bullets) {
    ctx.save();
    ctx.shadowColor = "#ffe082";
    ctx.shadowBlur = 8;
    ctx.fillStyle = "#ffe082";
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawParticles() {
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life / 34);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawNightOverlay() {
  if (!isNight) return;

  ctx.save();

  if (world.mode === "outside") {
    ctx.fillStyle = "rgba(5, 10, 20, 0.28)";
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

    const px = player.x - camera.x + player.width / 2;
    const py = player.y - camera.y + player.height / 2;

    const gradient = ctx.createRadialGradient(px, py, 24, px, py, 220);
    gradient.addColorStop(0, "rgba(255,255,220,0)");
    gradient.addColorStop(0.52, "rgba(255,255,220,0.06)");
    gradient.addColorStop(1, "rgba(5,10,20,0.70)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
  } else {
    ctx.fillStyle = "rgba(5, 10, 20, 0.12)";
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

    const gradient = ctx.createRadialGradient(
      player.x + player.width / 2,
      player.y + player.height / 2,
      30,
      player.x + player.width / 2,
      player.y + player.height / 2,
      320
    );
    gradient.addColorStop(0, "rgba(255,245,210,0)");
    gradient.addColorStop(0.6, "rgba(255,245,210,0.03)");
    gradient.addColorStop(1, "rgba(5,10,20,0.22)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
  }

  ctx.restore();
}

function drawHud() {
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fillRect(16, 16, 290, 120);

  ctx.fillStyle = "#ffffff";
  ctx.font = "600 15px Arial";
  ctx.fillText(`HP: ${Math.max(0, Math.round(player.hp))}`, 28, 40);
  ctx.fillText(`Hunger: ${Math.max(0, Math.round(player.hunger))}`, 28, 64);
  ctx.fillText(`Food: ${player.food}`, 28, 88);
  ctx.fillText(`Wood: ${player.wood}`, 130, 88);
  ctx.fillText(`Medkits: ${player.medkits}`, 28, 112);

  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.fillRect(170, 28, 110, 10);
  ctx.fillStyle = "#ff5a5a";
  ctx.fillRect(170, 28, (Math.max(0, player.hp) / 100) * 110, 10);

  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.fillRect(170, 52, 110, 10);
  ctx.fillStyle = "#ffd54a";
  ctx.fillRect(170, 52, (Math.max(0, player.hunger) / 100) * 110, 10);

  ctx.fillStyle = "#cfe1f3";
  ctx.fillText(`Weapon: ${player.weapon === "pistol" ? "Pistol" : "Shotgun"}`, 130, 112);

  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fillRect(SCREEN_W - 240, 16, 220, 72);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(`Time: ${formatTime(timeOfDay)}`, SCREEN_W - 220, 42);
  ctx.fillText(`Day ${day} ${isNight ? "Night" : "Day"}`, SCREEN_W - 220, 68);

  ctx.fillStyle = "rgba(255,255,255,0.78)";
  ctx.font = "600 14px Arial";
  ctx.fillText("F = enter/exit/floors | E = eat/barricade | X = remove", 18, SCREEN_H - 36);
  ctx.fillText("Q = melee | 1 = pistol | 2 = shotgun | I = inventory", 18, SCREEN_H - 16);
}

function drawInventoryOverlay() {
  if (!inventoryOpen) return;

  ctx.save();
  ctx.fillStyle = "rgba(5, 10, 20, 0.58)";
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

  const boxW = 500;
  const boxH = 320;
  const boxX = (SCREEN_W - boxW) / 2;
  const boxY = (SCREEN_H - boxH) / 2;

  ctx.fillStyle = "rgba(20, 28, 40, 0.96)";
  ctx.fillRect(boxX, boxY, boxW, boxH);

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 2;
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 30px Arial";
  ctx.fillText("Inventory", boxX + 28, boxY + 46);

  ctx.font = "600 20px Arial";
  ctx.fillStyle = "#cdd8e4";
  ctx.fillText(`Food: ${player.food}`, boxX + 30, boxY + 98);
  ctx.fillText(`Wood: ${player.wood}`, boxX + 30, boxY + 132);
  ctx.fillText(`Medkits: ${player.medkits}`, boxX + 30, boxY + 166);
  ctx.fillText(`Current weapon: ${player.weapon === "pistol" ? "Pistol" : "Shotgun"}`, boxX + 30, boxY + 200);
  ctx.fillText("Pistol ammo: Infinite", boxX + 30, boxY + 234);
  ctx.fillText("Shotgun ammo: Infinite", boxX + 30, boxY + 268);

  ctx.font = "500 16px Arial";
  ctx.fillStyle = "#91a4b8";
  ctx.fillText("Press I to close", boxX + 30, boxY + 300);

  ctx.restore();
}

function renderOutside() {
  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  drawGrassWorld();
  drawTrees();
  for (const house of outsideHouses) drawHouseOutside(house);
  drawOutsideLoot();
  drawZombieCollection(zombies);
  drawPlayer();
  drawBullets();
  drawParticles();

  ctx.restore();
}

function renderInside() {
  drawInsideBackground();
  drawInsideWalls();
  drawInsideBarricades();
  drawStairs();
  drawInsideLoot();
  drawZombieCollection(indoorZombies);
  drawPlayer();
  drawBullets();
  drawParticles();
}

function render() {
  ctx.clearRect(0, 0, SCREEN_W, SCREEN_H);

  if (world.mode === "outside") {
    renderOutside();
  } else {
    renderInside();
  }

  drawNightOverlay();
  drawHud();
  drawInventoryOverlay();
}

function update() {
  if (!gameStarted || gameEnded) return;

  frameTick++;

  updateDayCycle();
  updatePlayer();
  autoCollectLoot();
  updateOutsideZombies();
  updateInsidePressure();
  updateIndoorZombies();
  updateBullets();
  updateParticles();
  updateCamera();
  checkGameOver();
  render();

  animationId = requestAnimationFrame(update);
}

canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = SCREEN_W / rect.width;
  const scaleY = SCREEN_H / rect.height;
  mouseScreen.x = (event.clientX - rect.left) * scaleX;
  mouseScreen.y = (event.clientY - rect.top) * scaleY;
});

canvas.addEventListener("mousedown", () => {
  shootBullet();
});

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();

  if (["w", "a", "s", "d", "e", "f", "x", "q", "i", "1", "2", "arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key) || event.key === " ") {
    event.preventDefault();
  }

  if (key === "w") keys.w = true;
  if (key === "a") keys.a = true;
  if (key === "s") keys.s = true;
  if (key === "d") keys.d = true;
  if (key === "e") tryActionE();
  if (key === "f") tryEnterExitF();
  if (key === "x") tryRemoveBarricade();
  if (key === "q") doMelee();
  if (key === "i") inventoryOpen = !inventoryOpen;
  if (key === "1") {
    player.weapon = "pistol";
    statusText.textContent = "Pistol selected";
  }
  if (key === "2") {
    player.weapon = "shotgun";
    statusText.textContent = "Shotgun selected";
  }
});

window.addEventListener("keyup", (event) => {
  const key = event.key.toLowerCase();
  if (key === "w") keys.w = false;
  if (key === "a") keys.a = false;
  if (key === "s") keys.s = false;
  if (key === "d") keys.d = false;
});

startBtn.addEventListener("click", () => {
  resetGame();
  startOverlay.classList.add("hidden");
  endOverlay.classList.add("hidden");
  gameStarted = true;
  gameEnded = false;
  update();
});

restartBtn.addEventListener("click", () => {
  resetGame();
  startOverlay.classList.add("hidden");
  endOverlay.classList.add("hidden");
  gameStarted = true;
  gameEnded = false;
  update();
});

resetGame();
render();