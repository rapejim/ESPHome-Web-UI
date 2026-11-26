import esphome.codegen as cg
import esphome.config_validation as cv
from esphome.const import CONF_ID
from esphome.core import coroutine_with_priority
from esphome.coroutine import CoroPriority
from esphome.types import ConfigType

DEPENDENCIES = ["web_server"]
AUTO_LOAD = ["preferences"]
DOMAIN = "dashboard_storage"

dashboard_storage_ns = cg.esphome_ns.namespace("dashboard_storage")
DashboardStorage = dashboard_storage_ns.class_("DashboardStorage", cg.Component)

CONFIG_SCHEMA = cv.Schema(
    {
        cv.GenerateID(): cv.declare_id(DashboardStorage),
    }
).extend(cv.COMPONENT_SCHEMA)


@coroutine_with_priority(CoroPriority.WIFI)
async def to_code(config: ConfigType) -> None:
    var = cg.new_Pvariable(config[CONF_ID])
    await cg.register_component(var, config)
