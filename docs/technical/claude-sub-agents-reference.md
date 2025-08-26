# Claude Code Sub-Agents Reference

## Available Sub-Agents for Task Tool

### Programming Languages
- python-expert, javascript-expert, typescript-expert, java-expert, kotlin-expert
- go-expert, rust-expert, c-expert, cpp-expert, csharp-expert
- php-expert, ruby-expert, swift-expert, dart-expert, scala-expert
- clojure-expert, haskell-expert, erlang-expert, elixir-expert, ocaml-expert
- lua-expert, perl-expert

### Web Frameworks
- react-expert, nextjs-expert, vue-expert, angular-expert, angularjs-expert
- svelte-expert, solidjs-expert, remix-expert, astro-expert, nuxt-expert

### Backend/APIs
- nodejs-expert, express-expert, fastify-expert, nestjs-expert
- flask-expert, django-expert, fastapi-expert, spring-boot-expert
- laravel-expert, rails-expert, phoenix-expert, gin-expert, actix-expert
- rest-expert, graphql-expert, grpc-expert

### Databases
- postgres-expert, mysql-expert, mongodb-expert, redis-expert, sqlite-expert
- cassandra-expert, neo4j-expert, cockroachdb-expert, dynamodb-expert
- elasticsearch-expert, opensearch-expert

### Cloud/DevOps
- docker-expert, kubernetes-expert, terraform-expert, ansible-expert
- github-actions-expert, gitlab-ci-expert, circleci-expert, jenkins-expert

### Testing
- jest-expert, cypress-expert, playwright-expert, selenium-expert
- vitest-expert, mocha-expert, jasmine-expert, ava-expert, testcafe-expert

### Mobile
- react-native-expert, flutter-expert, ios-expert, android-expert, expo-expert

### AI/ML
- tensorflow-expert, pytorch-expert, scikit-learn-expert, numpy-expert
- pandas-expert, langchain-expert, openai-api-expert

### Special Purpose
- general-purpose (for complex multi-step tasks)
- statusline-setup, output-style-setup

## Usage
Use with the Task tool: `Task(subagent_type="expert-name", prompt="your task", description="brief description")`