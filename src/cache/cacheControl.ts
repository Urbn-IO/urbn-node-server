import { Directive } from 'type-graphql';
import { CacheControlScope } from '../types';

interface CacheHint {
  maxAge: number;
  scope?: CacheControlScope;
}

function CacheControl({ maxAge, scope }: CacheHint) {
  if (!maxAge && !scope) {
    throw new Error('Missing maxAge or scope param for @CacheControl');
  }

  let sdl = '@cacheControl(';
  if (maxAge) {
    sdl += `maxAge: ${maxAge}`;
  }
  if (scope) {
    sdl += ` scope: ${scope}`;
  }
  sdl += ')';

  return Directive(sdl);
}

export default CacheControl;
