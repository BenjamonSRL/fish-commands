const config = require('config');
const stopped = require('stopped');

let players = {};

const createPlayer = (player) => {
  players[player.uuid()] = {
    name: player.name,
    muted: false,
    mod: false,
    admin: player.admin,
    watch: false,
    member: false,
    pet: '',
    highlight: null,
    history: [],
    fakeAdmin: false,
  };
  return;
};

const save = () => {
  const newPlayers = {};
  Object.keys(players).forEach((pl) => {
    if (players[pl].admin || players[pl].mod || players[pl].member) {
      newPlayers[pl] = players[pl];
    }
    return;
  });
  const stringified = JSON.stringify(newPlayers);
  Core.settings.put('fish', stringified);
  Core.settings.manualSave();
};

const setName = (realP) => {
  const p = getP(realP);
  let prefix = '';

  if (p.member) {
    prefix = config.MEMBER_PREFIX + ' ';
  }

  if (p.stopped) {
    realP.name = prefix + config.STOPPED_PREFIX + p.name;
    return;
  }
  if (p.muted) {
    realP.name = prefix + config.MUTED_PREFIX + p.name;
    return;
  }

  if (p.afk) {
    realP.name = prefix + config.AFK_PREFIX + p.name;
    return;
  }

  if (realP.admin) {
    p.admin = true;
    realP.name = prefix + config.ADMIN_PREFIX + p.name;
    return;
  }

  if (p.admin) {
    realP.admin = true;
    realP.name = prefix + config.ADMIN_PREFIX + p.name;
    return;
  }

  if (p.mod) {
    realP.name = prefix + config.MOD_PREFEIX + p.name;
    return;
  }
  realP.name = p.name;
};

const addPlayerHistory = (id, entry) => {
  const p = getPById(id);

  if (!p.history) p.history = [];

  if (p.history.length > 5) {
    p.history.shift();
  }

  p.history.push(entry);
};

const getP = (player) => {
  if (!players[player.uuid()]) {
    createPlayer(player);
  }
  return players[player.uuid()];
};

const getPById = (id) => {
  return players[id];
};

const stop = (target, staff, fromApi) => {
  const tp = players[target.uuid()];

  tp.stopped = true;
  target.unit().type = UnitTypes.stell;
  setName(target);
  target.sendMessage("[scarlet]Oopsy Whoopsie! You've been stopped, and marked as a griefer.");
  addPlayerHistory(target.uuid(), {
    action: 'stopped',
    by: staff ? staff.name : 'vote',
    time: Date.now(),
  });

  if (fromApi) return;
  stopped.addStopped(target.uuid());
  save();
};

const free = (target, staff, fromApi) => {
  players[target.uuid()].stopped = false;
  setName(target);
  target.unit().type = UnitTypes.alpha;
  addPlayerHistory(target.uuid(), {
    action: 'freed',
    by: staff ? staff.name : 'vote',
    time: Date.now(),
  });
  if (fromApi) return;
  target.sendMessage('[yellow]Looks like someone had mercy on you.');
  stopped.free(target.uuid());
  save();
};

const getAllIds = () => Object.keys(players);

Events.on(ServerLoadEvent, (e) => {
  const stringified = Core.settings.get('fish', '');

  if (stringified) players = JSON.parse(stringified);
});

module.exports = {
  createPlayer: createPlayer,
  save: save,
  setName: setName,
  addPlayerHistory: addPlayerHistory,
  getP: getP,
  stop: stop,
  free: free,
  getAllIds: getAllIds,
  getPById: getPById,
};
