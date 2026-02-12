
import React, { useState, useRef, useEffect } from 'react';
import { audioController } from './utils/audio';
import GameCanvas, { GameCanvasHandle } from './components/GameCanvas';
import MainMenu from './components/MainMenu';
import GameOverModal from './components/GameOverModal';
import SettingsModal from './components/SettingsModal';
import UpgradesModal from './components/UpgradesModal';
import ReviveModal from './components/ReviveModal';
import ShopModal from './components/ShopModal';
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
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [playerSkin, setPlayerSkin] = useState<Skin>(SKINS[0]);
  const [lastGameStats, setLastGameStats] = useState({ score: 0, time: 0, killedBy: '', killCount: 0 });
  const [isReviveVisible, setIsReviveVisible] = useState(false);
  const [reviveCost, setReviveCost] = useState(5);
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

  // key: Global Audio Init
  useEffect(() => {
    // Preload immediately
    audioController.preload();

    // Try to start music on any interaction (Capture phase to catch everything)
    const startMusic = () => {
      audioController.requestMusicStart();
      // We keep listening until it succeeds (handled inside controller)
    };

    // Attempt immediately (Best effort - works if domain already has interaction/allowance)
    startMusic();

    window.addEventListener('click', startMusic, true);
    window.addEventListener('touchstart', startMusic, true);
    window.addEventListener('keydown', startMusic, true);

    return () => {
      window.removeEventListener('click', startMusic, true);
      window.removeEventListener('touchstart', startMusic, true);
      window.removeEventListener('keydown', startMusic, true);
    };
  }, []);

  const gameRef = useRef<GameCanvasHandle>(null);

  const handleStartGame = (name: string, skin: Skin) => {
    setPlayerName(name);
    setPlayerSkin(skin);
    setAppState('PLAYING');
    setIsGameOverVisible(false);
    setIsReviveVisible(false);
    setReviveCost(5); // Reset revive cost
  };

  const handleGameOver = (score: number, time: number, killedBy: string, killCount: number) => {
    setLastGameStats({ score, time, killedBy, killCount });
    setIsReviveVisible(true); // Show Revive Modal first
  };

  const handleReviveWithDiamonds = () => {
    if (wallet.diamonds >= reviveCost) {
      handleWalletChange({
        ...wallet,
        diamonds: wallet.diamonds - reviveCost
      });
      setReviveCost(prev => prev * 2); // Double cost
      setIsReviveVisible(false);
      gameRef.current?.revive();
    }
  };

  const handleReviveWithAd = () => {
    // Ad revive is visual for now but functionally same as diamond for testing
    setIsReviveVisible(false);
    gameRef.current?.revive();
  };

  const handleSkipRevive = () => {
    setIsReviveVisible(false);
    setIsGameOverVisible(true);
  };

  const handleRestart = () => {
    setIsGameOverVisible(false);
    setReviveCost(5); // Reset revive cost
    // We can either re-mount or just signal reset
    setAppState('MENU');
    setTimeout(() => handleStartGame(playerName, playerSkin), 50);
  };

  const handleHome = () => {
    setIsGameOverVisible(false);
    setAppState('MENU');
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

  const handleWatchAdGold = () => {
    setWallet(prev => ({ ...prev, coins: prev.coins + 50 }));
    setIsShopOpen(false);
    audioController.play('coin', true);
  };

  const handleWatchAdDiamond = () => {
    setWallet(prev => ({ ...prev, diamonds: prev.diamonds + 2 }));
    setIsShopOpen(false);
    audioController.play('coin', true);
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
          onOpenShop={() => setIsShopOpen(true)}
        />
      )}

      {appState === 'PLAYING' && (
        <GameCanvas
          ref={gameRef}
          playerName={playerName}
          playerSkin={playerSkin}
          botNameList={BOT_NAMES}
          onGameOver={handleGameOver}
          isPaused={isGameOverVisible || isReviveVisible}
          pitCount={gameSettings.pitCount}
          enabledPitTypes={gameSettings.enabledPitTypes}
          arenaId={gameSettings.arenaId}
          foodType={gameSettings.foodType}
          wallet={wallet}
          onWalletChange={handleWalletChange}
          upgradeLevels={upgradeLevels}
        />
      )}

      {isReviveVisible && (
        <ReviveModal
          countdownSeconds={3}
          diamondCost={reviveCost}
          wallet={wallet}
          onReviveWithDiamonds={handleReviveWithDiamonds}
          onReviveWithAd={handleReviveWithAd}
          onSkip={handleSkipRevive}
        />
      )}

      {isGameOverVisible && (
        <GameOverModal
          score={lastGameStats.score}
          time={lastGameStats.time}
          killedBy={lastGameStats.killedBy}
          killCount={lastGameStats.killCount}
          rank={Math.floor(Math.random() * 100) + 1} // Randomized rank for now
          onRestart={handleRestart}
          onHome={handleHome}
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

      <ShopModal
        isOpen={isShopOpen}
        onClose={() => setIsShopOpen(false)}
        onWatchAdGold={handleWatchAdGold}
        onWatchAdDiamond={handleWatchAdDiamond}
      />
    </div>
  );
};

export default App;
