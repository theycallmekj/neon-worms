import {
    AdMob,
    AdOptions,
    RewardAdOptions,
    AdMobRewardItem,
    AdMobError,
    InterstitialAdPluginEvents,
    RewardAdPluginEvents
} from '@capacitor-community/admob';

// Test IDs for Android (Universal)
const TEST_IDS = {
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
};

class AdManager {
    private initialized = false;

    async initialize() {
        if (this.initialized) return;
        try {
            await AdMob.initialize({
                initializeForTesting: true,
            });
            this.initialized = true;
            console.log('AdMob Initialized');
        } catch (e) {
            console.error('AdMob Init Error', e);
        }
    }

    async showInterstitial() {
        try {
            const options: AdOptions = {
                adId: TEST_IDS.interstitial,
                isTesting: true,
            };
            await AdMob.prepareInterstitial(options);
            await AdMob.showInterstitial();
            console.log('Interstitial Ad Shown');
        } catch (e) {
            console.error('Interstitial Ad Error', e);
        }
    }

    async showRewarded(): Promise<boolean> {
        return new Promise(async (resolve) => {
            try {
                const options: RewardAdOptions = {
                    adId: TEST_IDS.rewarded,
                    isTesting: true,
                };

                let isRewarded = false;

                const rewardListener = await AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward: AdMobRewardItem) => {
                    console.log('User earned reward:', reward);
                    isRewarded = true;
                });

                const dismissListener = await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
                    rewardListener.remove();
                    dismissListener.remove();
                    resolve(isRewarded);
                });

                const errorListener = await AdMob.addListener(RewardAdPluginEvents.FailedToShow, (error: AdMobError) => {
                    rewardListener.remove();
                    dismissListener.remove();
                    errorListener.remove();
                    console.error('Rewarded ad failed to show', error);
                    resolve(false);
                });

                await AdMob.prepareRewardVideoAd(options);
                await AdMob.showRewardVideoAd();
            } catch (e) {
                console.error('Rewarded Ad Error', e);
                resolve(false);
            }
        });
    }
}

export const adManager = new AdManager();
