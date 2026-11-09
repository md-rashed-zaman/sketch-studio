import {Composition, Folder} from 'remotion';
import {durationFromAudio, FPS} from '../kit';
import {KitGallery, KitGalleryVertical, galleryTiming} from './KitGallery';
import {SampleEpisode, sampleAudio} from '../episodes/sample/episode';
import {
  CachingCacheAsideShort,
  CachingEpisode,
  CachingStampedeShort,
  CachingTtlShort,
  cacheAsideShortAudio,
  cachingAudio,
  stampedeShortAudio,
  ttlShortAudio,
} from '../episodes/caching/episode';
import {
  ScalingEpisode,
  ScalingLagShort,
  ScalingMillionShort,
  ScalingSessionsShort,
  lagShortAudio,
  millionShortAudio,
  scalingAudio,
  sessionsShortAudio,
} from '../episodes/scaling/episode';

export const RemotionRoot = () => (
  <>
    <Folder name="Kit">
      <Composition
        id="KitGallery"
        component={KitGallery}
        durationInFrames={galleryTiming.duration * FPS}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="KitGallery-Vertical"
        component={KitGalleryVertical}
        durationInFrames={galleryTiming.duration * FPS}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </Folder>
    <Folder name="Episodes">
      <Composition
        id="sample"
        component={SampleEpisode}
        calculateMetadata={durationFromAudio(sampleAudio)}
        durationInFrames={FPS}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="caching"
        component={CachingEpisode}
        calculateMetadata={durationFromAudio(cachingAudio, 12)}
        durationInFrames={FPS}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="scaling"
        component={ScalingEpisode}
        calculateMetadata={durationFromAudio(scalingAudio, 12)}
        durationInFrames={FPS}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </Folder>
    <Folder name="Shorts">
      <Composition
        id="caching-short-stampede"
        component={CachingStampedeShort}
        calculateMetadata={durationFromAudio(stampedeShortAudio, 2)}
        durationInFrames={FPS}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="caching-short-cache-aside"
        component={CachingCacheAsideShort}
        calculateMetadata={durationFromAudio(cacheAsideShortAudio, 2)}
        durationInFrames={FPS}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="caching-short-ttl"
        component={CachingTtlShort}
        calculateMetadata={durationFromAudio(ttlShortAudio, 2)}
        durationInFrames={FPS}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="scaling-short-million"
        component={ScalingMillionShort}
        calculateMetadata={durationFromAudio(millionShortAudio, 2)}
        durationInFrames={FPS}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="scaling-short-sessions"
        component={ScalingSessionsShort}
        calculateMetadata={durationFromAudio(sessionsShortAudio, 2)}
        durationInFrames={FPS}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="scaling-short-lag"
        component={ScalingLagShort}
        calculateMetadata={durationFromAudio(lagShortAudio, 2)}
        durationInFrames={FPS}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </Folder>
  </>
);
