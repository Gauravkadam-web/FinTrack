from alembic.config import Config
from alembic.script import ScriptDirectory


def test_alembic_revisions_chain():
    alembic_cfg = Config("alembic.ini")
    script = ScriptDirectory.from_config(alembic_cfg)

    # Verify migration chain heads and sequence
    heads = script.get_heads()
    assert len(heads) == 1
    assert heads[0] == "0003_add_auth_and_user_scoping"

    # Verify base revision
    base_rev = script.get_base()
    assert base_rev == "0001_initial_schema"

    # Verify linear revision walk
    revisions = list(script.walk_revisions())
    assert len(revisions) == 3
    assert revisions[0].revision == "0003_add_auth_and_user_scoping"
    assert revisions[1].revision == "0002_seed_categories"
    assert revisions[2].revision == "0001_initial_schema"
