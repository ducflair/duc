/// <reference path="./.sst/platform/config.d.ts" />


const region = "us-east-2";
const hostname = "duc.ducflair.com";
const server_url = "https://" + hostname;
const dev_server_url = "http://localhost:3000";


export default $config({
  app(input) {
    return {
      name: "duc",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      aws: {
        region: "us-east-2",
      },
      cloudflare: "5.41.0",
    };
  },

  async run() {
    const isProduction = Boolean($app.stage === "production" && !$dev);
    const isPreview = Boolean($app.stage !== "production" && !$dev);
    const stageHostname = $app.stage === 'preview' ? `${$app.stage}-${hostname}` : undefined;
    const domainName = isProduction 
      ? hostname 
      : $app.stage === 'preview' && `preview-${hostname}`;

    // Secrets - https://sst.dev/docs/component/secret
    const secrets: sst.Secret[] = [];
    // secrets.push();
    
    // Host a Next.js app - https://sst.dev/docs/start/aws/nextjs
    new sst.aws.Nextjs("MyWeb", {
      // vpc
      domain: domainName && {
        name: domainName,
        dns: sst.cloudflare.dns(),
      },
      path: "apps/web",
      link: [
        ...secrets,
      ],
      environment: {
        DEV: $dev ? "true" : "false",
        PREVIEW: isPreview ? "true" : "false",
        PRODUCTION: isProduction ? "true" : "false",
        NEXT_PUBLIC_SERVER_URL: isProduction
        ? server_url 
        : $dev ? dev_server_url : `https://${stageHostname}`,
      },
    });

    // Host the Python generated docs
    new sst.aws.StaticSite("MyPythonDocs", {
      build: {
        command: "bun duc-py:docs:build",
        output: "packages/duc-py/docs/_build/html",
      },
      domain: domainName && {
        name: `python.${domainName}`,
        dns: sst.cloudflare.dns(),
      },
    });
  },
});
