
import React, { useState, useRef, useEffect } from 'react';
import GameCanvas, { GameCanvasHandle } from './components/GameCanvas';
import MainMenu from './components/MainMenu';
import GameOverModal from './components/GameOverModal';
import SettingsModal from './components/SettingsModal';
import UpgradesModal from './components/UpgradesModal';
import { BOT_NAMES, DEFAULT_PIT_COUNT, ALL_PIT_TYPES, DEFAULT_ARENA, UPGRADE_COSTS, MAX_UPGRADE_LEVEL, SKINS } from './constants';
import { GameSettings, PlayerWallet, UpgradeLevels, PowerUpType, Skin } from './types';

type AppState = 'MENU' | 'PLAYING';

// localStorage helpers
const loadWallet = (): PlayerWallet => {
  try {
    const saved = localStorage.getItem('neonworms_wallet');
    if (saved) return JSON.parse(saved);
  } catch { }
  return { coins: 0, diamonds: 0 };
};

const saveWallet = (w: PlayerWallet) => {
  localStorage.setItem('neonworms_wallet', JSON.stringify(w));
};

const loadUpgrades = (): UpgradeLevels => {
  try {
    const saved = localStorage.getItem('neonworms_upgrades');
    if (saved) return JSON.parse(saved);
  } catch { }
  return { magnet: 0, speed: 0, freeze: 0, shield: 0 };
};

const saveUpgrades = (u: UpgradeLevels) => {
  localStorage.setItem('neonworms_upgrades', JSON.stringify(u));
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('MENU');
  const [isGameOverVisible, setIsGameOverVisible] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUpgradesOpen, setIsUpgradesOpen] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [playerSkin, setPlayerSkin] = useState<Skin>(SKINS[0]);
  const [lastGameStats, setLastGameStats] = useState({ score: 0, time: 0, killedBy: '' });
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    pitCount: DEFAULT_PIT_COUNT,
    enabledPitTypes: ALL_PIT_TYPES,
    arenaId: DEFAULT_ARENA,
    foodType: 'random'
  });

  // Persistent currency, upgrades & custom skins
  const [wallet, setWallet] = useState<PlayerWallet>(loadWallet);
  const [upgradeLevels, setUpgradeLevels] = useState<UpgradeLevels>(loadUpgrades);
  const [customSkins, setCustomSkins] = useState<Skin[]>(() => {
    try {
      const saved = localStorage.getItem('neonworms_custom_skins');
      if (saved) return JSON.parse(saved);
    } catch { }
    return [];
  });

  // Persist on change
  useEffect(() => { saveWallet(wallet); }, [wallet]);
  useEffect(() => { saveUpgrades(upgradeLevels); }, [upgradeLevels]);
  useEffect(() => {
    localStorage.setItem('neonworms_custom_skins', JSON.stringify(customSkins));
  }, [customSkins]);

  const gameRef = useRef<GameCanvasHandle>(null);

  const handleStartGame = (name: string, skin: Skin) => {
    setPlayerName(name);
    setPlayerSkin(skin);
    setAppState('PLAYING');
    setIsGameOverVisible(false);
  };

  const handleGameOver = (score: number, time: number, killedBy: string) => {
    setLastGameStats({ score, time, killedBy });
    setIsGameOverVisible(true);
  };

  const handleRestart = () => {
    setAppState('MENU');
    setIsGameOverVisible(false);
  };

  const handleRevive = () => {
    if (gameRef.current) {
      gameRef.current.revive();
      setIsGameOverVisible(false);
    }
  };

  const handleOpenSettings = () => {
    setIsSettingsOpen(true);
  };

  const handleCloseSettings = () => {
    setIsSettingsOpen(false);
  };

  const handleSaveSettings = (newSettings: GameSettings) => {
    setGameSettings(newSettings);
  };

  const handleWalletChange = (newWallet: PlayerWallet) => {
    setWallet(newWallet);
  };

  const handleAddCustomSkin = (skin: Skin, cost: { type: 'coins' | 'diamonds', amount: number }) => {
    if (cost.type === 'coins' && wallet.coins < cost.amount) return;
    if (cost.type === 'diamonds' && wallet.diamonds < cost.amount) return;

    // Deduct cost
    const newWallet = { ...wallet };
    if (cost.type === 'coins') newWallet.coins -= cost.amount;
    else newWallet.diamonds -= cost.amount;

    setWallet(newWallet);
    setCustomSkins(prev => [...prev, skin]);
  };

  const handleUpgrade = (type: PowerUpType, currency: 'coins' | 'diamonds') => {
    const level = upgradeLevels[type];
    if (level >= MAX_UPGRADE_LEVEL) return;

    const cost = currency === 'coins' ? UPGRADE_COSTS.coins[level] : UPGRADE_COSTS.diamonds[level];
    if (currency === 'coins' && wallet.coins < cost) return;
    if (currency === 'diamonds' && wallet.diamonds < cost) return;

    // Deduct cost
    const newWallet = { ...wallet };
    if (currency === 'coins') newWallet.coins -= cost;
    else newWallet.diamonds -= cost;

    // Increment level
    const newUpgrades = { ...upgradeLevels, [type]: level + 1 };

    setWallet(newWallet);
    setUpgradeLevels(newUpgrades);
  };

  return (
    <div className="w-full h-screen bg-slate-900 overflow-hidden relative">
      {appState === 'MENU' && (
        <MainMenu
          onStart={handleStartGame}
          onUpdateSettings={handleSaveSettings}
          currentSettings={gameSettings}
          onOpenUpgrades={() => setIsUpgradesOpen(true)}
          wallet={wallet}
          customSkins={customSkins}
          onAddCustomSkin={handleAddCustomSkin}
        />
      )}

      {appState === 'PLAYING' && (
        <GameCanvas
          ref={gameRef}
          playerName={playerName}
          playerSkin={playerSkin}
          botNameList={BOT_NAMES}
          onGameOver={handleGameOver}
          isPaused={isGameOverVisible}
          pitCount={gameSettings.pitCount}
          enabledPitTypes={gameSettings.enabledPitTypes}
          arenaId={gameSettings.arenaId}
          foodType={gameSettings.foodType}
          wallet={wallet}
          onWalletChange={handleWalletChange}
          upgradeLevels={upgradeLevels}
        />
      )}

      {isGameOverVisible && (
        <GameOverModal
          score={lastGameStats.score}
          time={lastGameStats.time}
          killedBy={lastGameStats.killedBy}
          onRestart={handleRestart}
          onRevive={handleRevive}
        />
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={handleCloseSettings}
        settings={gameSettings}
        onSave={handleSaveSettings}
      />

      <UpgradesModal
        isOpen={isUpgradesOpen}
        onClose={() => setIsUpgradesOpen(false)}
        wallet={wallet}
        upgradeLevels={upgradeLevels}
        onUpgrade={handleUpgrade}
      />
    </div>
  );
};

export default App;
