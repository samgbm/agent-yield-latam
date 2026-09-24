#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

#[test]
fn initialize_and_deposit() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(YieldAgentContract, ());
    let client = YieldAgentContractClient::new(&env, &contract_id);

    let merchant = Address::generate(&env);
    let agent = Address::generate(&env);
    let threshold = 50_000_000_i128; // 50 USDC (6 decimals)

    client.initialize(&merchant, &agent, &threshold);
    client.deposit(&merchant, &100_000_000_i128);

    let (liquid, yield_bal) = client.get_status();
    assert_eq!(liquid, 100_000_000);
    assert_eq!(yield_bal, 0);
}

#[test]
fn auto_sweep_moves_excess_to_yield() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(YieldAgentContract, ());
    let client = YieldAgentContractClient::new(&env, &contract_id);

    let merchant = Address::generate(&env);
    let agent = Address::generate(&env);
    let threshold = 50_000_000_i128;

    client.initialize(&merchant, &agent, &threshold);
    client.deposit(&merchant, &150_000_000_i128);
    client.auto_sweep(&agent);

    let (liquid, yield_bal) = client.get_status();
    assert_eq!(liquid, threshold);
    assert_eq!(yield_bal, 100_000_000);
}

#[test]
fn withdraw_from_yield_to_liquid() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(YieldAgentContract, ());
    let client = YieldAgentContractClient::new(&env, &contract_id);

    let merchant = Address::generate(&env);
    let agent = Address::generate(&env);

    client.initialize(&merchant, &agent, &50_000_000_i128);
    client.deposit(&merchant, &150_000_000_i128);
    client.auto_sweep(&agent);
    client.withdraw(&merchant, &40_000_000_i128);

    let (liquid, yield_bal) = client.get_status();
    assert_eq!(liquid, 90_000_000);
    assert_eq!(yield_bal, 60_000_000);
}
