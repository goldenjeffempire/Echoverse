# ADR-005: AI Provider Architecture

## Status
Accepted

## Context
The platform requires AI capabilities for website generation, content creation, and SEO optimization. We need a robust, scalable architecture that supports multiple AI providers with failover capabilities.

## Decision
We will implement a provider abstraction layer with:
- Primary provider: Ollama/LocalAI (local deployment)
- Fallback provider: OpenAI API
- Circuit breaker pattern for resilience
- Health checks and automatic failover

## Rationale
1. **Local-first approach**: Reduces API costs and latency
2. **Fallback reliability**: OpenAI provides backup when local provider fails
3. **Circuit breaker**: Prevents cascading failures
4. **Observability**: Health checks provide operational visibility

## Implementation
- `server/ai-providers/`: Provider implementations
- `server/ai-providers/router.ts`: Request routing logic
- Circuit breaker with configurable thresholds

## Consequences
### Positive
- Cost-effective AI operations
- High availability through failover
- Flexible provider swapping

### Negative
- Additional complexity in deployment
- Need to maintain local AI models
- Circuit breaker tuning required

## Date
2025-10-10
