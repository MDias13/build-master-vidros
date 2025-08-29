import { Routes } from '@angular/router';
import { LandingComponent } from './landing/manter/landing.component';

export const routes: Routes = [
{ path: '', component: LandingComponent},
{ path: '**', redirectTo: '' },
];