const isEmpty = require('lodash.isempty');
const get = require('lodash.get');

class ApiGatewayEndpointCachingSettings {
  constructor(functionName, functionSettings, globalSettings) {
    this.functionName = functionName;

    // TODO multiple http endpoints
    let cachingConfig = functionSettings.events.filter(e => e.http != null)[0].http.caching;
    if (!cachingConfig) {
      this.cachingEnabled = false;
      return;
    }
    this.cachingEnabled = cachingConfig.enabled;
    this.cacheTtlInSeconds = cachingConfig.ttlInSeconds || globalSettings.cacheTtlInSeconds;
    this.cacheKeyParameters = cachingConfig.cacheKeyParameters;
  }
}

class ApiGatewayCachingSettings {
  constructor(serverless, options) {
    if (!get(serverless, 'service.custom.apiGatewayCaching')) {
      return;
    }
    this.cachingEnabled = serverless.service.custom.apiGatewayCaching.enabled;

    if (options) {
      this.stage = options.stage || serverless.service.provider.stage;
      this.region = options.region || serverless.service.provider.region;
    } else {
      this.stage = serverless.service.provider.stage;
      this.region = serverless.service.provider.region;
    }

    this.endpointSettings = [];
    if (!this.cachingEnabled) {
      return;
    }

    this.cacheClusterSize = serverless.service.custom.apiGatewayCaching.clusterSize;
    this.cacheTtlInSeconds = serverless.service.custom.apiGatewayCaching.ttlInSeconds;

    for (let functionName in serverless.service.functions) {
      let functionSettings = serverless.service.functions[functionName];
      if (this.isApiGatewayEndpoint(functionSettings)) {
        this.endpointSettings.push(new ApiGatewayEndpointCachingSettings(functionName, functionSettings, this))
      }
    }
  }

  isApiGatewayEndpoint(functionSettings) {
    if (isEmpty(functionSettings.events)) {
      return false;
    }
    return functionSettings.events.filter(e => e.http != null).length > 0;
  }
}
module.exports = ApiGatewayCachingSettings
