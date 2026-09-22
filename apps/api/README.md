<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Authorization & branch access policy

This application uses a branch-scoped authorization model with a clear separation between global management roles and branch-scoped operational roles.

### Role hierarchy

The role definitions are declared in [src/user/constants/user.constant.ts](src/user/constants/user.constant.ts) and enforced in [src/user/providers/permission.provider.ts](src/user/providers/permission.provider.ts).

- Global and manager roles: SUPERADMIN, ADMIN, OWNER, MANAGER
- Branch-scoped roles: BRANCH_MANAGER, CASHIER, CHEF, WAITER

The role hierarchy is used to decide whether one role can manage another role and whether a role can assign users to a branch.

### Branch visibility rules

Branch access is intentionally scoped by branch ownership:

- Global and manager-level roles can view all branches.
- Branch-scoped users can only read and operate within their own assigned branch.
- If a non-global user has no branch assigned, they are treated as having no valid branch scope and are denied access to branch-level operations.

This rule is enforced in [src/branch/providers/branch.service.ts](src/branch/providers/branch.service.ts) by checking whether the requester is a global role before allowing unrestricted branch access.

### User management rules

User management is restricted to roles that can manage users:

- GLOBAL/manager roles can create, list, update, and deactivate users within their permitted scope.
- Branch-scoped users are not allowed to manage other users unless the role hierarchy explicitly permits it.
- When a user is assigned a global role, the system disallows assigning a branch to that user.
- When a user is assigned a branch-scoped role, the system requires a valid branch assignment.

### Branch management rules

Branch management is restricted to roles permitted to manage branches:

- SUPERADMIN, ADMIN, OWNER, and MANAGER may create, update, and deactivate branches.
- BRANCH_MANAGER is treated as a branch-scoped role for branch access, not as a global branch-management role.
- Branch-scoped users can only view branch data for their own branch.

### Route and service enforcement

The current implementation separates route-level metadata and service-level logic:

- Controller metadata declares the public route contract for endpoints in [src/branch/branch.controller.ts](src/branch/branch.controller.ts) and [src/user/user.controller.ts](src/user/user.controller.ts).
- The service layer performs the actual branch-scope enforcement in [src/branch/providers/branch.service.ts](src/branch/providers/branch.service.ts) and user authorization checks in [src/user/providers/user.service.ts](src/user/providers/user.service.ts).

This is intentional for the current business model: branch-scoped users should not see data outside their own branch, while higher-level roles retain broader access.

### Operational note

For future contributors, treat the service-layer access checks as the source of truth for branch-scoped behavior. If a new endpoint is added, it should follow the same pattern:

1. validate the current user
2. enforce branch scope for branch-scoped roles
3. allow global roles to access broader data
4. keep role assignment rules consistent with the hierarchy policy

## Project setup

```bash
$ npm install
```

## Private S3 attachments

Expense attachments are uploaded directly from the browser with API-issued
presigned POST data. The bucket must remain private. Object keys are generated
by the API as `{environment}/{resource}/{fileId}/{filename}`, for example
`production/expenses/<file-id>/receipt.pdf`.

Set `AWS_REGION` and `AWS_S3_BUCKET`. For local or non-AWS hosting, also set
both `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`. Leave both credential
variables blank when an IAM task, instance, or workload role is available.

Apply [config/s3-cors.example.json](config/s3-cors.example.json) to the bucket,
replacing the origin with the deployed frontend URL. Apply
[config/s3-lifecycle.example.json](config/s3-lifecycle.example.json) to remove
uploads that remain tagged as pending for one day. Configure default bucket
encryption and block all public access in AWS.

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Observability

In production applications, observability is essential for understanding how your system behaves, detecting issues early, and maintaining reliable performance.

[NestJS Observe](https://observe.nestjs.com) automatically instruments your NestJS application, giving you deep visibility into your system with minimal setup:

- **Distributed tracing:** Follow requests across services and understand how they flow through your system.
- **Waterfall analysis:** Visualize request execution and identify slow operations, bottlenecks, and unexpected delays.
- **Performance analysis:** Analyze application performance in real time and quickly pinpoint areas that need optimization.
- **Metrics:** Track key application and infrastructure metrics to understand system health and performance trends.
- **Logging:** Centralize and correlate logs with traces and other telemetry to make debugging easier.
- **Error tracking:** Detect errors quickly and investigate their root causes with the surrounding context.
- **SLA monitoring:** Track service-level objectives and identify when your application is approaching or exceeding defined thresholds.
- **Alarms and alerts:** Set up alerts for critical errors, performance degradation, SLA violations, and other anomalies so your team can react quickly.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Auto-instrument your application with [NestJS Observer](https://observer.nestjs.com). Distributed tracing, metrics, and logging made easy. Error tracking and performance monitoring for your NestJS applications.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
