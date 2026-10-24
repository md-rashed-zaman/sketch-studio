import {Composition, Folder} from 'remotion';
import {durationFromAudio, FPS} from '../kit';
import {KitGallery, KitGalleryVertical, galleryTiming} from './KitGallery';
import {SampleEpisode, sampleAudio} from '../episodes/sample/episode';
import {CachingEpisode, cachingAudio} from '../episodes/caching/episode';

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
    </Folder>
  </>
);
