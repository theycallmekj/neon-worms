import {
    AdMob,
    AdOptions,
    RewardAdOptions,
    AdMobRewardItem,
    AdMobError,
    RewardAdPluginEvents,
    InterstitialAdPluginEvents
} from '@capacitor-community/admob';

// Test IDs for Android (Universal)
const TEST_IDS = {
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
};

class AdManager {
    private initialized = false;
    private isInterstitialReady = false;
    private isRewardedReady = false;

    async initialize() {
        if (this.initialized) return;
        try {
            await AdMob.initialize({
                initializeForTesting: true,
            });
            this.initialized = true;
            console.log('AdMob Initialized');

            // Preload ads immediately after init
            this.prepareInterstitial();
            this.prepareRewarded();
        } catch (e) {
            console.error('AdMob Init Error', e);
        }
    }

    // --- INTERSTITIAL ---

    async prepareInterstitial() {
        try {
            const options: AdOptions = {
                adId: TEST_IDS.interstitial,
                isTesting: true,
            };
            await AdMob.prepareInterstitial(options);
            this.isInterstitialReady = true;
            console.log('Interstitial Ad Prepared');
        } catch (e) {
            console.error('Failed to prepare interstitial', e);
            this.isInterstitialReady = false;
        }
    }

    async showInterstitial() {
        if (!this.isInterstitialReady) {
            console.log('Interstitial not ready, preparing now...');
            await this.prepareInterstitial();
        }

        try {
            if (this.isInterstitialReady) {
                await AdMob.showInterstitial();
                this.isInterstitialReady = false; // Consumed

                // Preload next one after a short delay
                setTimeout(() => this.prepareInterstitial(), 2000);
            }
        } catch (e) {
            console.error('Interstitial Ad Show Error', e);
        }
    }

    // --- REWARDED ---

    async prepareRewarded() {
        try {
            const options: RewardAdOptions = {
                adId: TEST_IDS.rewarded,
                isTesting: true,
            };
            await AdMob.prepareRewardVideoAd(options);
            this.isRewardedReady = true;
            console.log('Rewarded Ad Prepared');
        } catch (e) {
            console.error('Failed to prepare rewarded ad', e);
            this.isRewardedReady = false;
        }
    }

    async showRewarded(): Promise<boolean> {
        // If not ready, try to load it first
        if (!this.isRewardedReady) {
            console.log('Rewarded ad not ready, preparing...');
            await this.prepareRewarded();
            if (!this.isRewardedReady) return false; // Failed to load
        }

        return new Promise(async (resolve) => {
            let isRewarded = false;
            let listeners: any[] = [];

            const cleanup = () => {
                listeners.forEach(l => l.remove());
                // Preload next one
                this.isRewardedReady = false;
                setTimeout(() => this.prepareRewarded(), 2000);
            };

            try {
                listeners.push(await AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward: AdMobRewardItem) => {
                    console.log('User earned reward:', reward);
                    isRewarded = true;
                }));

                listeners.push(await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
                    cleanup();
                    resolve(isRewarded);
                }));

                listeners.push(await AdMob.addListener(RewardAdPluginEvents.FailedToShow, (error: AdMobError) => {
                    console.error('Rewarded ad failed to show', error);
                    cleanup();
                    resolve(false);
                }));

                await AdMob.showRewardVideoAd();
            } catch (e) {
                console.error('Rewarded Ad Show Error', e);
                cleanup();
                resolve(false);
            }
        });
    }
}

export const adManager = new AdManager();
