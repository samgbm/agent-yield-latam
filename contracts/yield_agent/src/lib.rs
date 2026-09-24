#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Merchant,
    Agent,
    SweepThreshold,
    LiquidBalance,
    YieldBalance,
    Initialized,
}

#[contract]
pub struct YieldAgentContract;

#[contractimpl]
impl YieldAgentContract {
    /// Initialize vault for a merchant: authorized agent and sweep threshold (USDC stroops / smallest unit).
    pub fn initialize(
        env: Env,
        merchant: Address,
        agent: Address,
        sweep_threshold: i128,
    ) {
        if env.storage().instance().has(&DataKey::Initialized) {
            panic!("already initialized");
        }
        if sweep_threshold < 0 {
            panic!("threshold must be non-negative");
        }
        merchant.require_auth();
        env.storage().instance().set(&DataKey::Merchant, &merchant);
        env.storage().instance().set(&DataKey::Agent, &agent);
        env.storage()
            .instance()
            .set(&DataKey::SweepThreshold, &sweep_threshold);
        env.storage().instance().set(&DataKey::LiquidBalance, &0_i128);
        env.storage().instance().set(&DataKey::YieldBalance, &0_i128);
        env.storage().instance().set(&DataKey::Initialized, &true);
    }

    /// Record a USDC deposit into the liquid balance (MVP: bookkeeping until token transfers are wired).
    pub fn deposit(env: Env, merchant: Address, amount: i128) {
        Self::require_initialized(&env);
        if amount <= 0 {
            panic!("amount must be positive");
        }
        Self::require_merchant(&env, &merchant);
        merchant.require_auth();
        let liquid = Self::read_liquid(&env);
        env.storage()
            .instance()
            .set(&DataKey::LiquidBalance, &(liquid + amount));
    }

    /// Agent-only: move excess liquid balance above threshold into yield (simulated pool balance).
    pub fn auto_sweep(env: Env, agent: Address) {
        Self::require_initialized(&env);
        Self::require_agent(&env, &agent);
        agent.require_auth();

        let threshold = env
            .storage()
            .instance()
            .get(&DataKey::SweepThreshold)
            .unwrap_or(0);
        let liquid = Self::read_liquid(&env);
        if liquid <= threshold {
            return;
        }
        let excess = liquid - threshold;
        let yield_bal = Self::read_yield(&env);
        env.storage()
            .instance()
            .set(&DataKey::LiquidBalance, &threshold);
        env.storage()
            .instance()
            .set(&DataKey::YieldBalance, &(yield_bal + excess));
    }

    /// Merchant withdraws from yield back to liquid balance (MVP path before external pool integration).
    pub fn withdraw(env: Env, merchant: Address, amount: i128) {
        Self::require_initialized(&env);
        if amount <= 0 {
            panic!("amount must be positive");
        }
        Self::require_merchant(&env, &merchant);
        merchant.require_auth();

        let yield_bal = Self::read_yield(&env);
        if amount > yield_bal {
            panic!("insufficient yield balance");
        }
        let liquid = Self::read_liquid(&env);
        env.storage()
            .instance()
            .set(&DataKey::YieldBalance, &(yield_bal - amount));
        env.storage()
            .instance()
            .set(&DataKey::LiquidBalance, &(liquid + amount));
    }

    /// Returns (liquid_balance, yield_balance).
    pub fn get_status(env: Env) -> (i128, i128) {
        Self::require_initialized(&env);
        (Self::read_liquid(&env), Self::read_yield(&env))
    }

    pub fn get_sweep_threshold(env: Env) -> i128 {
        Self::require_initialized(&env);
        env.storage()
            .instance()
            .get(&DataKey::SweepThreshold)
            .unwrap_or(0)
    }
}

impl YieldAgentContract {
    fn require_initialized(env: &Env) {
        if !env.storage().instance().has(&DataKey::Initialized) {
            panic!("not initialized");
        }
    }

    fn require_merchant(env: &Env, merchant: &Address) {
        let stored: Address = env
            .storage()
            .instance()
            .get(&DataKey::Merchant)
            .expect("merchant missing");
        if stored != *merchant {
            panic!("not merchant");
        }
    }

    fn require_agent(env: &Env, agent: &Address) {
        let stored: Address = env
            .storage()
            .instance()
            .get(&DataKey::Agent)
            .expect("agent missing");
        if stored != *agent {
            panic!("not agent");
        }
    }

    fn read_liquid(env: &Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::LiquidBalance)
            .unwrap_or(0)
    }

    fn read_yield(env: &Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::YieldBalance)
            .unwrap_or(0)
    }
}
