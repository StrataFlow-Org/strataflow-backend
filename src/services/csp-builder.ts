export interface CspDirectives {
  defaultSrc?: string[];
  scriptSrc?: string[];
  styleSrc?: string[];
  imgSrc?: string[];
  connectSrc?: string[];
  fontSrc?: string[];
  objectSrc?: string[];
  frameAncestors?: string[];
}

export class CspBuilder {
  public static buildPolicy(directives: CspDirectives, nonce?: string): string {
    const parts: string[] = [];

    const formatList = (sources: string[] = [], addNonce = false): string => {
      const list = [...sources];
      if (addNonce && nonce) {
        list.push(`'nonce-${nonce}'`);
      }
      return list.join(' ');
    };

    if (directives.defaultSrc) parts.push(`default-src ${formatList(directives.defaultSrc)}`);
    if (directives.scriptSrc) parts.push(`script-src ${formatList(directives.scriptSrc, true)}`);
    if (directives.styleSrc) parts.push(`style-src ${formatList(directives.styleSrc, true)}`);
    if (directives.imgSrc) parts.push(`img-src ${formatList(directives.imgSrc)}`);
    if (directives.connectSrc) parts.push(`connect-src ${formatList(directives.connectSrc)}`);
    if (directives.fontSrc) parts.push(`font-src ${formatList(directives.fontSrc)}`);
    if (directives.objectSrc) parts.push(`object-src ${formatList(directives.objectSrc)}`);
    if (directives.frameAncestors) parts.push(`frame-ancestors ${formatList(directives.frameAncestors)}`);

    return parts.join('; ');
  }
}
