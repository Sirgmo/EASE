import Link from 'next/link';
import {
  ArrowRight,
  Shield,
  Eye,
  FileSearch,
  Bot,
  Clock,
  CheckCircle2,
  Users,
  FileText,
  TrendingUp,
  Star,
  ChevronDown,
  Play,
  Building2,
  Calculator,
  AlertTriangle,
} from 'lucide-react';
import { Navbar, Footer } from '@/components/layout';

export default function HomePage() {
  return (
    <div className="relative">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pb-20 pt-28 sm:pb-32 sm:pt-36">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-secondary-50" />
          <div className="absolute right-0 top-0 h-[600px] w-[600px] rounded-full bg-primary-100/40 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-accent-100/30 blur-3xl" />
        </div>

        <div className="container-ease">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white px-4 py-2 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-500"></span>
              </span>
              <span className="text-sm font-medium text-primary-700">AI-Powered Real Estate</span>
            </div>

            <h1 className="font-display text-4xl font-bold leading-tight text-secondary-900 sm:text-5xl md:text-6xl">
              Buy Your Home with
              <span className="block bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent sm:inline">
                {' '}Complete Clarity
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-secondary-600 sm:text-xl">
              See your total costs, risks, and timeline before you commit. EASE uses AI to replace
              guesswork with transparency.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/dashboard"
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-8 py-4 font-semibold text-white shadow-lg shadow-primary-500/25 transition-all hover:bg-primary-700 sm:w-auto"
              >
                Try the Demo
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#how-it-works"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-secondary-200 bg-white px-8 py-4 font-semibold text-secondary-700 hover:bg-secondary-50 sm:w-auto"
              >
                <Play className="h-5 w-5" />
                See How It Works
              </a>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-secondary-500">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-success-500" />
                <span>Bank-level security</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success-500" />
                <span>No hidden fees</span>
              </div>
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-success-500" />
                <span>AI-powered insights</span>
              </div>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="relative mx-auto mt-16 max-w-5xl">
            <div className="overflow-hidden rounded-2xl border border-secondary-200 bg-white shadow-2xl">
              <div className="flex items-center gap-2 border-b border-secondary-100 bg-secondary-50 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-400"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
                  <div className="h-3 w-3 rounded-full bg-green-400"></div>
                </div>
                <div className="ml-4 flex-1 rounded-md bg-white px-3 py-1 text-xs text-secondary-400">
                  app.ease.com/dashboard
                </div>
              </div>
              <div className="bg-secondary-50 p-6">
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="rounded-xl border border-secondary-100 bg-white p-4 shadow-sm lg:col-span-2">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-100">
                        <Building2 className="h-7 w-7 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-secondary-900">123 Queen Street West, Unit 2405</h3>
                        <p className="text-sm text-secondary-500">Toronto, ON - 2 bed, 2 bath</p>
                        <div className="mt-3 flex gap-6">
                          <div>
                            <p className="text-xs text-secondary-400">Purchase Price</p>
                            <p className="font-semibold text-secondary-900">$899,000</p>
                          </div>
                          <div>
                            <p className="text-xs text-secondary-400">Days to Close</p>
                            <p className="font-semibold text-primary-600">47</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-secondary-100 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-secondary-600">Risk Score</span>
                      <span className="rounded-full bg-success-100 px-2 py-0.5 text-xs font-semibold text-success-700">LOW</span>
                    </div>
                    <div className="mt-3 flex items-end gap-2">
                      <span className="text-4xl font-bold text-secondary-900">85</span>
                      <span className="mb-1 text-sm text-secondary-400">/100</span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary-100">
                      <div className="h-full w-[85%] rounded-full bg-success-500"></div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 rounded-xl border border-secondary-100 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    {['Search', 'Offer', 'Accepted', 'Conditions', 'Closing'].map((step, i) => (
                      <div key={step} className="flex flex-col items-center">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${i < 3 ? 'bg-success-500 text-white' : i === 3 ? 'bg-primary-500 text-white ring-4 ring-primary-100' : 'bg-secondary-100 text-secondary-400'}`}>
                          {i < 3 ? <CheckCircle2 className="h-5 w-5" /> : <span className="text-sm font-semibold">{i + 1}</span>}
                        </div>
                        <span className={`mt-2 text-xs font-medium ${i === 3 ? 'text-primary-600' : 'text-secondary-500'}`}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logos */}
      <section className="border-y border-secondary-100 bg-white py-12">
        <div className="container-ease">
          <p className="text-center text-sm font-medium text-secondary-400">TRUSTED BY LEADING REAL ESTATE PROFESSIONALS</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-50 grayscale">
            {['Royal LePage', 'RE/MAX', 'Century 21', 'Keller Williams', 'Coldwell Banker'].map((name) => (
              <div key={name} className="text-lg font-bold text-secondary-400">{name}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 bg-white py-20 sm:py-28">
        <div className="container-ease">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary-600">Features</span>
            <h2 className="mt-3 font-display text-3xl font-bold text-secondary-900 sm:text-4xl">Everything You Need for a Transparent Transaction</h2>
            <p className="mt-4 text-lg text-secondary-600">EASE combines AI intelligence with human expertise to give you complete visibility into your real estate journey.</p>
          </div>

          <div className="mx-auto mt-16 grid max-w-6xl gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="group rounded-2xl border border-secondary-100 bg-white p-6 transition-all hover:border-primary-200 hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100">
                <Calculator className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold text-secondary-900">Total Cost Calculator</h3>
              <p className="mt-2 text-secondary-600">See every fee, tax, and closing cost upfront. Including Ontario&apos;s Land Transfer Tax and Toronto&apos;s double LTT.</p>
            </div>
            <div className="group rounded-2xl border border-secondary-100 bg-white p-6 transition-all hover:border-primary-200 hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-100">
                <TrendingUp className="h-6 w-6 text-accent-600" />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold text-secondary-900">AI Risk Assessment</h3>
              <p className="mt-2 text-secondary-600">Our AI analyzes flood zones, permits, market trends, and more to give you a comprehensive risk score.</p>
            </div>
            <div className="group rounded-2xl border border-secondary-100 bg-white p-6 transition-all hover:border-primary-200 hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success-100">
                <FileSearch className="h-6 w-6 text-success-600" />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold text-secondary-900">Document Analysis</h3>
              <p className="mt-2 text-secondary-600">Upload contracts and get instant red flag detection. Our AI spots unusual clauses and potential issues.</p>
            </div>
            <div className="group rounded-2xl border border-secondary-100 bg-white p-6 transition-all hover:border-primary-200 hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning-100">
                <Clock className="h-6 w-6 text-warning-600" />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold text-secondary-900">Timeline Tracking</h3>
              <p className="mt-2 text-secondary-600">Visual progress from search to closing. Know exactly where you stand and what&apos;s coming next.</p>
            </div>
            <div className="group rounded-2xl border border-secondary-100 bg-white p-6 transition-all hover:border-primary-200 hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-error-100">
                <Users className="h-6 w-6 text-error-600" />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold text-secondary-900">Team Coordination</h3>
              <p className="mt-2 text-secondary-600">Connect all parties - lawyers, inspectors, mortgage brokers - in one place with clear task assignments.</p>
            </div>
            <div className="group rounded-2xl border border-secondary-100 bg-white p-6 transition-all hover:border-primary-200 hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary-100">
                <Bot className="h-6 w-6 text-secondary-600" />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold text-secondary-900">AI Assistant</h3>
              <p className="mt-2 text-secondary-600">24/7 AI support that answers questions, drafts counter-offers, and guides you through every step.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="scroll-mt-20 bg-secondary-50 py-20 sm:py-28">
        <div className="container-ease">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary-600">How It Works</span>
            <h2 className="mt-3 font-display text-3xl font-bold text-secondary-900 sm:text-4xl">From Search to Keys in 4 Simple Steps</h2>
          </div>

          <div className="mx-auto mt-16 max-w-4xl">
            <div className="relative">
              <div className="absolute left-8 top-0 hidden h-full w-0.5 bg-primary-200 md:block"></div>
              <div className="space-y-12">
                <div className="relative flex gap-6 md:gap-8">
                  <div className="relative z-10 flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-500/30">
                    <Eye className="h-7 w-7" />
                  </div>
                  <div className="pt-2">
                    <span className="text-sm font-semibold text-primary-600">Step 1</span>
                    <h3 className="mt-1 font-display text-xl font-semibold text-secondary-900">Search with Confidence</h3>
                    <p className="mt-2 text-secondary-600">Browse properties with instant cost breakdowns and AI risk scores. Know the true cost before you even view.</p>
                  </div>
                </div>
                <div className="relative flex gap-6 md:gap-8">
                  <div className="relative z-10 flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-500/30">
                    <FileText className="h-7 w-7" />
                  </div>
                  <div className="pt-2">
                    <span className="text-sm font-semibold text-primary-600">Step 2</span>
                    <h3 className="mt-1 font-display text-xl font-semibold text-secondary-900">Make an Informed Offer</h3>
                    <p className="mt-2 text-secondary-600">Our AI helps you craft competitive offers based on market data, with win probability predictions.</p>
                  </div>
                </div>
                <div className="relative flex gap-6 md:gap-8">
                  <div className="relative z-10 flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-500/30">
                    <AlertTriangle className="h-7 w-7" />
                  </div>
                  <div className="pt-2">
                    <span className="text-sm font-semibold text-primary-600">Step 3</span>
                    <h3 className="mt-1 font-display text-xl font-semibold text-secondary-900">Navigate Conditions</h3>
                    <p className="mt-2 text-secondary-600">Track inspections, financing, and document reviews. Get AI analysis of contracts and reports.</p>
                  </div>
                </div>
                <div className="relative flex gap-6 md:gap-8">
                  <div className="relative z-10 flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-500/30">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <div className="pt-2">
                    <span className="text-sm font-semibold text-primary-600">Step 4</span>
                    <h3 className="mt-1 font-display text-xl font-semibold text-secondary-900">Close with Peace of Mind</h3>
                    <p className="mt-2 text-secondary-600">Final walkthrough, document signing, and key handover - all tracked and coordinated in one place.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-700 py-16">
        <div className="container-ease">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="font-display text-4xl font-bold text-white">$2.4B+</div>
              <div className="mt-1 text-primary-100">Transaction Volume</div>
            </div>
            <div className="text-center">
              <div className="font-display text-4xl font-bold text-white">15,000+</div>
              <div className="mt-1 text-primary-100">Happy Buyers</div>
            </div>
            <div className="text-center">
              <div className="font-display text-4xl font-bold text-white">98%</div>
              <div className="mt-1 text-primary-100">Satisfaction Rate</div>
            </div>
            <div className="text-center">
              <div className="font-display text-4xl font-bold text-white">47 Days</div>
              <div className="mt-1 text-primary-100">Avg. Time to Close</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-20 bg-white py-20 sm:py-28">
        <div className="container-ease">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary-600">Pricing</span>
            <h2 className="mt-3 font-display text-3xl font-bold text-secondary-900 sm:text-4xl">Simple, Transparent Pricing</h2>
            <p className="mt-4 text-lg text-secondary-600">No hidden fees. No surprises. Just like our platform.</p>
          </div>

          <div className="mx-auto mt-12 grid max-w-5xl gap-8 lg:grid-cols-3">
            <div className="rounded-2xl border border-secondary-200 bg-white p-8">
              <h3 className="font-display text-xl font-semibold text-secondary-900">Explorer</h3>
              <p className="mt-2 text-sm text-secondary-600">Perfect for browsing</p>
              <div className="mt-6">
                <span className="font-display text-4xl font-bold text-secondary-900">$0</span>
                <span className="text-secondary-500">/forever</span>
              </div>
              <ul className="mt-8 space-y-3">
                <li className="flex items-center gap-3 text-sm text-secondary-600"><CheckCircle2 className="h-5 w-5 text-success-500" />Property search</li>
                <li className="flex items-center gap-3 text-sm text-secondary-600"><CheckCircle2 className="h-5 w-5 text-success-500" />Basic calculator</li>
                <li className="flex items-center gap-3 text-sm text-secondary-600"><CheckCircle2 className="h-5 w-5 text-success-500" />Market insights</li>
                <li className="flex items-center gap-3 text-sm text-secondary-600"><CheckCircle2 className="h-5 w-5 text-success-500" />Save 5 properties</li>
              </ul>
              <Link href="/dashboard" className="mt-8 block w-full rounded-xl border border-secondary-200 py-3 text-center font-semibold text-secondary-700 hover:bg-secondary-50">Get Started</Link>
            </div>

            <div className="relative rounded-2xl border-2 border-primary-500 bg-white p-8 shadow-xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary-500 px-4 py-1 text-sm font-semibold text-white">Most Popular</div>
              <h3 className="font-display text-xl font-semibold text-secondary-900">Buyer Pro</h3>
              <p className="mt-2 text-sm text-secondary-600">Full power for buyers</p>
              <div className="mt-6">
                <span className="font-display text-4xl font-bold text-secondary-900">$49</span>
                <span className="text-secondary-500">/transaction</span>
              </div>
              <ul className="mt-8 space-y-3">
                <li className="flex items-center gap-3 text-sm text-secondary-600"><CheckCircle2 className="h-5 w-5 text-success-500" />Everything in Explorer</li>
                <li className="flex items-center gap-3 text-sm text-secondary-600"><CheckCircle2 className="h-5 w-5 text-success-500" />AI risk assessment</li>
                <li className="flex items-center gap-3 text-sm text-secondary-600"><CheckCircle2 className="h-5 w-5 text-success-500" />Document analysis</li>
                <li className="flex items-center gap-3 text-sm text-secondary-600"><CheckCircle2 className="h-5 w-5 text-success-500" />Full cost breakdown</li>
                <li className="flex items-center gap-3 text-sm text-secondary-600"><CheckCircle2 className="h-5 w-5 text-success-500" />Transaction dashboard</li>
                <li className="flex items-center gap-3 text-sm text-secondary-600"><CheckCircle2 className="h-5 w-5 text-success-500" />AI assistant</li>
              </ul>
              <Link href="/dashboard" className="mt-8 block w-full rounded-xl bg-primary-600 py-3 text-center font-semibold text-white hover:bg-primary-700">Start Transaction</Link>
            </div>

            <div className="rounded-2xl border border-secondary-200 bg-white p-8">
              <h3 className="font-display text-xl font-semibold text-secondary-900">Teams</h3>
              <p className="mt-2 text-sm text-secondary-600">For professionals</p>
              <div className="mt-6">
                <span className="font-display text-4xl font-bold text-secondary-900">Custom</span>
              </div>
              <ul className="mt-8 space-y-3">
                <li className="flex items-center gap-3 text-sm text-secondary-600"><CheckCircle2 className="h-5 w-5 text-success-500" />Everything in Pro</li>
                <li className="flex items-center gap-3 text-sm text-secondary-600"><CheckCircle2 className="h-5 w-5 text-success-500" />Unlimited transactions</li>
                <li className="flex items-center gap-3 text-sm text-secondary-600"><CheckCircle2 className="h-5 w-5 text-success-500" />White-label</li>
                <li className="flex items-center gap-3 text-sm text-secondary-600"><CheckCircle2 className="h-5 w-5 text-success-500" />API access</li>
                <li className="flex items-center gap-3 text-sm text-secondary-600"><CheckCircle2 className="h-5 w-5 text-success-500" />Priority support</li>
              </ul>
              <a href="mailto:sales@ease.app" className="mt-8 block w-full rounded-xl border border-secondary-200 py-3 text-center font-semibold text-secondary-700 hover:bg-secondary-50">Contact Sales</a>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-secondary-50 py-20 sm:py-28">
        <div className="container-ease">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary-600">Testimonials</span>
            <h2 className="mt-3 font-display text-3xl font-bold text-secondary-900 sm:text-4xl">Loved by Home Buyers</h2>
          </div>

          <div className="mx-auto mt-12 grid max-w-6xl gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-secondary-100 bg-white p-6">
              <div className="flex gap-1">
                {[1,2,3,4,5].map((s) => <Star key={s} className="h-5 w-5 fill-warning-400 text-warning-400" />)}
              </div>
              <p className="mt-4 text-secondary-600">&ldquo;EASE showed me the true cost of buying in Toronto - including the double land transfer tax I didn&apos;t know about!&rdquo;</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-600">S</div>
                <div>
                  <p className="font-semibold text-secondary-900">Sarah C.</p>
                  <p className="text-sm text-secondary-500">First-time Buyer, Toronto</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-secondary-100 bg-white p-6">
              <div className="flex gap-1">
                {[1,2,3,4,5].map((s) => <Star key={s} className="h-5 w-5 fill-warning-400 text-warning-400" />)}
              </div>
              <p className="mt-4 text-secondary-600">&ldquo;The AI risk score flagged an issue with the property permits that my agent missed. Worth every penny.&rdquo;</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-600">M</div>
                <div>
                  <p className="font-semibold text-secondary-900">Marcus T.</p>
                  <p className="text-sm text-secondary-500">Home Buyer, Mississauga</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-secondary-100 bg-white p-6">
              <div className="flex gap-1">
                {[1,2,3,4,5].map((s) => <Star key={s} className="h-5 w-5 fill-warning-400 text-warning-400" />)}
              </div>
              <p className="mt-4 text-secondary-600">&ldquo;As a real estate lawyer, I recommend EASE to all my clients. The document analysis is impressive.&rdquo;</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-600">J</div>
                <div>
                  <p className="font-semibold text-secondary-900">Jennifer M.</p>
                  <p className="text-sm text-secondary-500">RE Lawyer, Vancouver</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 bg-white py-20 sm:py-28">
        <div className="container-ease">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary-600">FAQ</span>
            <h2 className="mt-3 font-display text-3xl font-bold text-secondary-900 sm:text-4xl">Frequently Asked Questions</h2>
          </div>

          <div className="mx-auto mt-12 max-w-3xl divide-y divide-secondary-200">
            <details className="group py-6">
              <summary className="flex cursor-pointer items-center justify-between text-left">
                <span className="font-semibold text-secondary-900">How accurate is the cost calculator?</span>
                <ChevronDown className="h-5 w-5 text-secondary-400 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-4 text-secondary-600">Our calculator uses official Ontario Land Transfer Tax rates and includes Toronto&apos;s municipal LTT when applicable.</p>
            </details>
            <details className="group py-6">
              <summary className="flex cursor-pointer items-center justify-between text-left">
                <span className="font-semibold text-secondary-900">What does the AI risk score measure?</span>
                <ChevronDown className="h-5 w-5 text-secondary-400 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-4 text-secondary-600">The risk score (0-100) analyzes environmental factors, permit history, market volatility, structural considerations, and legal/title factors.</p>
            </details>
            <details className="group py-6">
              <summary className="flex cursor-pointer items-center justify-between text-left">
                <span className="font-semibold text-secondary-900">Is my data secure?</span>
                <ChevronDown className="h-5 w-5 text-secondary-400 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-4 text-secondary-600">Yes. We use bank-level encryption (AES-256) and never share your personal information with third parties.</p>
            </details>
            <details className="group py-6">
              <summary className="flex cursor-pointer items-center justify-between text-left">
                <span className="font-semibold text-secondary-900">Do I still need a real estate agent?</span>
                <ChevronDown className="h-5 w-5 text-secondary-400 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-4 text-secondary-600">EASE complements your existing team. We provide transparency and AI insights, while professionals handle negotiations.</p>
            </details>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-700 py-20">
        <div className="container-ease">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">Ready for Transparent Real Estate?</h2>
            <p className="mt-4 text-lg text-primary-100">Join thousands of buyers who trust EASE for their property transactions.</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/dashboard" className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 font-semibold text-primary-700 shadow-lg hover:bg-primary-50 sm:w-auto">
                Try the Demo <ArrowRight className="h-5 w-5" />
              </Link>
              <a href="mailto:hello@ease.app" className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/30 px-8 py-4 font-semibold text-white hover:bg-white/10 sm:w-auto">Contact Us</a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
