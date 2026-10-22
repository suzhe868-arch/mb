// Synthetic local model chain for the isolated F05 manual-publication test only.
import {connect} from './migration.mjs';
const c=await connect();
try{
 await c.query('BEGIN');
 await c.query("INSERT INTO public.vehicle_brands(brand_id,brand_name,status) VALUES(98001,'Synthetic Manual Brand','active')");
 await c.query("INSERT INTO public.vehicle_series(series_id,brand_id,series_name,status) VALUES(98002,98001,'Synthetic Manual Series','active')");
 await c.query("INSERT INTO public.vehicle_models(model_id,brand_id,series_id,model_name,model_year,profile_status) VALUES(98003,98001,98002,'Synthetic Manual 2026 Model',2026,'complete')");
 await c.query('COMMIT');
 console.log('F05_MANUAL_SYNTHETIC_MODEL_CHAIN_READY');
}catch(e){await c.query('ROLLBACK');throw e}finally{await c.end()}
