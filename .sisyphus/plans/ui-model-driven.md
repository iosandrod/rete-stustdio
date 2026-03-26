# UI-Model-Driven: 将 UI 逻辑降到最低，业务逻辑由域模型实现

## TL;DR
- Deliver a domain-driven architecture where UI is a pure presenter layer and all business logic resides in domain models and application services. UI acts as a view-only renderer and as a bridge to trigger domain use cases. Existing serialization remains as the persistence format and is mapped by a dedicated adapter layer. 
- Deliverables include a domain model (Node/Port/Socket/Connection/Graph), domain services (GraphService/NodeService), repositories, an adapter layer to map domain to runtime, and a minimal UI bridge (DomainStore) to drive the UI via the domain use cases.
- Effort: XL; Parallel: YES (multi-wave with limited cross-dependencies); Critical Path: Domain skeleton → Domain services → Mapping → UI bridge → Tests.

## Context
- Original request: move all business logic from UI to domain, keep UI as thin as possible.
- Downstream impact: UI events now invoke domain use cases; persistence/serialization remains via adapter.

## Metis Review (gaps addressed)
- Gaps: need a stable DomainStore for UI to subscribe; clear mapping between domain and runtime; testing strategy for domain and UI bindings.
- Guardrails: ensure never put business rules in UI components; keep UI pure rendering.

## Work Objectives
### Core Objective
- Move business rules and graph operations into domain model and application layer; UI becomes presentation-only and delegates to domain use cases.

### Deliverables
- Domain: Node.ts, Port.ts, Socket.ts, Connection.ts, Graph.ts, plus DomainEvent.ts
- Application: GraphUseCases.ts, NodeUseCases.ts
- Domain Services: GraphService.ts, NodeService.ts
- Infrastructure: InMemoryGraphRepository.ts; RuntimeAdapter.ts mapping domain to runtime models
- Bridge: DomainToRuntimeMapper.ts
- UI: DomainStore.ts (publication of read-only domain snapshot) and DomainBridge.ts (invoker to domain use cases)
- Tests: domain unit tests, integration tests for end-to-end domain flows

### Definition of Done (DoD)
- All domain entities have well-scoped invariants and tests.
- Domain services expose use cases that UI can call without any UI knowledge.
- A mapping layer converts between domain objects and runtime objects, preserving serialization.
- UI only calls use cases and subscribes to DomainStore to render state changes.
- All critical paths have QA scenarios (happy path and edge cases).

### Must Have
- Domain model definitions for Node/Port/Socket/Connection/Graph
- GraphService and NodeService with create/move/connect/layout use cases
- InMemoryGraphRepository and a minimal DomainStore in UI
- Mapping adapter DomainToRuntimeMapper
- Tests: unit tests for domain logic; integration tests for end-to-end

### Must NOT Have
- Any business logic in UI components; UI must not mutate domain state directly
- UI coupling to internal domain implementation details

## Verification Strategy
- 1) Domain unit tests verifying invariants and rules for Node/Port/Socket/Connection/Graph
- 2) Application/service tests for GraphUseCases and NodeUseCases
- 3) Integration tests covering node creation, connection, move, and layout via domain use cases
- 4) Mapping tests for DomainToRuntimeMapper ensuring correct bi-directional mapping
- 5) UI quick smoke tests ensuring UI triggers domain use cases and DomainStore updates render expected snapshots

## Execution Strategy
### Parallel Execution Waves
- Wave 1: Domain model primitives (Node/Port/Socket/Connection/Graph)
- Wave 2: Domain services and domain events
- Wave 3: Infrastructure (in-memory repository) and mapping adapters
- Wave 4: UI bridge (DomainStore + DomainBridge) and basic UI adapters
- Wave 5: End-to-end validation and QA scenarios

### Dependency Matrix (full plan)
- Domain primitives → used by Domain Services
- Domain Services → rely on Infrastructure Repository
- Mapping adapters → rely on both Domain & Runtime models
- UI Bridge → depends on DomainStore and use cases

## Agent Dispatch Summary
- Wave 1: Domain modeling (Node/Port/Socket/Connection/Graph) — Category: domain modeling
- Wave 2: Domain services (GraphService, NodeService) — Category: domain services
- Wave 3: Infrastructure & mapping adapters — Category: integration
- Wave 4: UI bridge and DomainStore wiring — Category: UI integration
- Wave 5: Tests & QA — Category: testing

## Task List (high-level)
- [T1] Create core/src/domain/{Node.ts,Port.ts,Socket.ts,Connection.ts,Graph.ts,DomainEvent.ts}
- [T2] Create core/src/domain/services/{GraphService.ts,NodeService.ts}
- [T3] Create core/src/domain/events/{DomainBus.ts}
- [T4] Create core/src/domain/repository/{DomainRepository.ts,InMemoryGraphRepository.ts}
- [T5] Create core/src/domain/mapping/{DomainToRuntimeMapper.ts}
- [T6] Create core/src/application/{GraphUseCases.ts,NodeUseCases.ts}
- [T7] Create core/src/infrastructure/{RuntimeAdapters.ts}
- [T8] Create core/src/ui/{DomainStore.ts,DomainBridge.ts}
- [T9] Write domain tests (unit) and integration tests
- [T10] Update CI/test scripts to run the new test suites
- [T11] Phase-out old UI logic gradually via refactors
- [T12] Validate with full end-to-end tests and performance checks

### Definition of Ready (DoR) for first milestone
- Domain primitives defined with basic invariants
- Domain services skeletons ready with stubbed use cases
- In-memory repository interface ready
- Mapping adapter skeleton ready
- UI binding scaffold (DomainStore) ready

## Acceptance Criteria (reiterated)
- UI is strictly presentational; all business rules live in domain & application layers
- UI triggers domain use cases; DomainStore feeds UI with read-only snapshots
- End-to-end flows (create node, connect, move, layout, save/load) preserved via domain use cases and mapping
- Tests cover domain invariants and end-to-end flows; performance remains acceptable
