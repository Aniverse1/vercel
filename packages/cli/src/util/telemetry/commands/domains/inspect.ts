import { TelemetryClient } from '../..';

export class DomainsInspectTelemetryClient extends TelemetryClient {
  trackCliArgumentDomainName(name: string | undefined) {
    if (name) {
      this.trackCliArgument({
        arg: 'domainName',
        value: this.redactedValue,
      });
    }
  }
}
