import assert from "assert";
import { 
  TestHelpers,
  AgentRegistry_Registered
} from "generated";
const { MockDb, AgentRegistry } = TestHelpers;

describe("AgentRegistry contract Registered event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for AgentRegistry contract Registered event
  const event = AgentRegistry.Registered.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

  it("AgentRegistry_Registered is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await AgentRegistry.Registered.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualAgentRegistryRegistered = mockDbUpdated.entities.AgentRegistry_Registered.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedAgentRegistryRegistered: AgentRegistry_Registered = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      agentId: event.params.agentId,
      agentURI: event.params.agentURI,
      owner: event.params.owner,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(actualAgentRegistryRegistered, expectedAgentRegistryRegistered, "Actual AgentRegistryRegistered should be the same as the expectedAgentRegistryRegistered");
  });
});
